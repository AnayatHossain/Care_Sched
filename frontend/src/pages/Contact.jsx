import React from 'react'
import { assets } from '../assets/assets';
import.meta.env

  const Contact = () => {

    const [result, setResult] = React.useState("");

    const onSubmit = async (event) => {
      event.preventDefault();
      setResult("Sending....");
      const formData = new FormData(event.target);

      formData.append("access_key", `${import.meta.env.VITE_TEST_VAR}`);

      const response = await fetch("https://api.web3forms.com/submit", {
        method: "POST",
        body: formData
      });

      const data = await response.json();

      if (data.success) {
        setResult("Message Submitted Successfully");
        event.target.reset();
      } else {
        console.log("Error", data);
        setResult(data.message);
      }
    };


    // Message to: murad.ny03@gmail.com

  return (

    <div>
        
      <div className="text-center text-2xl pt-10 text-gray-500">
        <p>CONTACT <span className="text-gray-700 font-semibold">US</span></p>
      </div>

      <div className="my-10 flex flex-col justify-center md:flex-row gap-10 mb-28 text-sm">
        <img className='w-full md:max-w-[360px]' src={assets.contact_image} alt="" />

        <div className="flex flex-col justify-center items-start gap-6">
          <p className="font-semibold text-lg text-gray-600">OUR OFFICE</p>
          <p className="text-gray-500">00000 Willms Station <br /> Suite 000, Washington, USA</p>
          <p className="text-gray-500">Tel: (000) 000-0000 <br /> Email: example@gmail.com</p>
          <p className="font-semibold text-lg text-gray-600">CAREERS AT CARESCHED</p>
          <p className="text-gray-500">Learn more about our teams and job openings.</p>
          <button className="border border-black px-8 py-4 text-sm hover:bg-black hover:text-white transition-all duration-500">Explore Jobs</button>
        </div>
      </div>


      {/* Form */}

      <div className="text-center text-2xl pt-10 text-gray-500">
        <p>GET IN<span className="text-gray-700 font-semibold"> TOUCH</span></p>
      </div>

      <div className="max-w-md mx-auto bg-white p-8 shadow-lg rounded-lg">

        <form onSubmit={onSubmit} className="space-y-4">

          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2">Your Name</label>
            <input
              type="text"
              name="name"
              placeholder="Your Name"
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-blue-200"
            />
          </div>

          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2">Phone Number</label>
            <input
              type="tel"
              name="phone"
              placeholder="Phone Number"
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-blue-200"
            />
          </div>

          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2">Write your message here</label>
            <textarea
              name="message"
              rows="6"
              placeholder="Enter Your Message"
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-blue-200"
            ></textarea>
          </div>

          <div>
            <button
              type="submit"
              className="w-full bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 focus:outline-none focus:ring focus:ring-blue-300"
            >
              Submit Now
            </button>
          </div>

        </form>

        <span className="text-green-600 mt-4 block">{result}</span>

      </div>
  
      
    </div>
  )
}

export default Contact
