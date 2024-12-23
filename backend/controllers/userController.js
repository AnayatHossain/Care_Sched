import validator from 'validator'
import bcrypt from 'bcrypt'
import userModel from '../models/userModel.js'
import jwt from 'jsonwebtoken'
import { v2 as cloudinary } from 'cloudinary'
import doctorModel from '../models/doctorModel.js'
import appointmentModel from '../models/appointmentModel.js'
import { Stripe } from 'stripe'



// API to registerUser

const registerUser = async (req,res) => {

    try {
        
        const {name , email , password} = req.body

        if(!name || !password || !email){
            return res.json({success:false , message:"Missing Details"})
        }
        
        if(!validator.isEmail(email)){
            return res.json({ success: false, message: "Enter a valid email" })
        }

        if(password.length < 8){

            return res.json({ success: false, message: "Enter a strong password" })
        }

        // hashing user password

        const salt = await bcrypt.genSalt(10)
        const hashedPassword = await bcrypt.hash(password,salt)

        const userData = {
            name,
            email,
            password : hashedPassword
        }

        const newUser = new userModel(userData)

        const user = await newUser.save()

        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET)

        res.json({success:true,token})

    } catch (error) {
        console.log(error)
        res.json({success:false , message:error.message})
    }
}

// API for user login

const loginUser = async (req,res) =>{

    try {

        const {email,password} = req.body

        const user = await userModel.findOne({email})

        if (!user) {
            return res.json({ success: false, message: 'user does not exist' })
        }

        const isMatch = await bcrypt.compare(password,user.password)

        if (isMatch) {
            
            const token = jwt.sign({id:user._id}, process.env.JWT_SECRET)

            res.json({success:true, token})
        }
        else{
            res.json({success:false,message:'Invalid Credentials'})
        }
        
    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

// API to get user Profile data

const getProfile = async (req,res) => {

    try {

        const {userId} = req.body

        const userData = await userModel.findById(userId).select('-password') 


        res.json({ success: true, userData });

        
    } catch (error) {
        console.log(error)
        res.json({success:false,message:error.message})
    }


}

// Api to update user profile

const updateProfile = async (req,res) => {

    try {
        

        const {userId, name, phone, address, dob, gender} = req.body

        const imageFile = req.file

        if(!name || !phone || !dob || !gender){

            return res.json({success:false , message:"Data Missing"})
        }
        await userModel.findByIdAndUpdate(userId,{name,phone,address:JSON.parse(address),dob,gender})

        if(imageFile){

         // upload image to cloudinary

            const imageUpload = await cloudinary.uploader.upload(imageFile.path,{resource_type:'image'})

            const imageURL = imageUpload.secure_url

            await userModel.findByIdAndUpdate(userId,{image:imageURL})

        }

        res.json({success:true, message:"Profile Updated"})

    } catch (error) {
        console.log(error)
        res.json({success:false, message:error.message})
    }
}


// API to book Appointment 

const bookAppointment = async (req,res) => {

    try {
        
        const { userId, docId, slotDate, slotTime } = req.body

        const docData = await doctorModel.findById(docId).select('-password')

        if (!docData.available) {
            
            return res.json({success:false, message:"Doctor Not Available"})
        }

        let slots_booked = docData.slots_booked

        // Checking for slots availability

        if (slots_booked[slotDate]) {
            
            if (slots_booked[slotDate].includes(slotTime)) {

                return res.json({ success: false, message: "Slot Not Available" })
            }
            else{

                slots_booked[slotDate].push(slotTime)
            }
        }
        else{

            slots_booked[slotDate] = []
            slots_booked[slotDate].push(slotTime)
        }

        const userData = await userModel.findById(userId).select('-password')

        delete docData.slots_booked

        const appointmentData = {

            userId,
            docId,
            userData,
            docData,
            amount:docData.fees,
            slotTime,
            slotDate,
            date: Date.now()

        }

        const newAppointment = new appointmentModel(appointmentData)

        await newAppointment.save()


        // Save new slots data in docData

        await doctorModel.findByIdAndUpdate(docId,{slots_booked})

        res.json({success:true, message:"Appointment Booked"})



    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}


// API to get user appointment for frontend my-appoint page

const listAppointment = async (req,res) => {

    try {

        const {userId} = req.body
        const appointments = await appointmentModel.find({userId})

        res.json({success:true, appointments})
        
    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}


// API to cancel appointment

const cancelAppointment = async (req,res) => {

    try {

        const {userId, appointmentId} = req.body

        const appointmentData = await appointmentModel.findById(appointmentId)

        // verify appointment user

        if (appointmentData.userId !== userId) {
            
            return res.json({success:false, message:"Unauthorized Action"})
        }
        
        await appointmentModel.findByIdAndUpdate(appointmentId, {cancelled:true})

        
        // releasing doctor slot

        const {docId, slotDate, slotTime} = appointmentData

        const doctorData = await doctorModel.findById(docId)

        let slots_booked = doctorData.slots_booked

        slots_booked[slotDate] = slots_booked[slotDate].filter(e => e !== slotTime)

        await doctorModel.findByIdAndUpdate(docId, {slots_booked})

        res.json({success:true, message:"Appointment Cancelled"})


        
    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }

}

// Online Payment system in Stripe


const stripe = new Stripe(process.env.Stripe_KEY);

const PaymentOnline = async (req, res) => {
    try {
        const { appointmentId } = req.body;

        const appointmentData = await appointmentModel.findById(appointmentId);

        if (!appointmentData || appointmentData.cancelled) {
            return res.json({ success: false, message: "Appointment Cancelled or Not Found" });
        }

        const order = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: [
                {
                    price_data: {
                        currency: process.env.CURRENCY,
                        product_data: {
                            name: `Appointment with ID ${appointmentId}`,
                        },
                        unit_amount: appointmentData.amount * 100, // amount in smallest currency unit
                    },
                    quantity: 1,
                    receipt: appointmentId,
                },
            ],
            mode: 'payment',
            success_url: process.env.FRONTEND_URL,
            cancel_url:  process.env.FRONTEND_URL,
        });

        res.json({ success: true, order });
    } catch (error) {
        console.error(error);
        res.json({ success: false, message: error.message });
    }
}






export { registerUser, loginUser, getProfile, updateProfile, bookAppointment, listAppointment, cancelAppointment, PaymentOnline }