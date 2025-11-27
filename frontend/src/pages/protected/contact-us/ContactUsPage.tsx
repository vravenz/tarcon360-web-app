import React, { useState, useEffect } from 'react';
import { FaEnvelope, FaPhone, FaMapMarkerAlt } from 'react-icons/fa';
import Card from '../../../components/Card';
import OneColumnLayout from '../../../components/OneColumnLayout';
import Navbar from '../../../components/Navbar';
import Footer from '../../../components/Footer';
import Button from '../../../components/Button';
import InputField from '../../../components/InputField';
import { useTheme } from '../../../context/ThemeContext';

const ContactUsPage: React.FC = () => {
  const { theme } = useTheme();

  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Form state for contact details (including message type)
  const [formData, setFormData] = useState({
    subject: '',
    message: '',
    messageType: '', // dropdown value
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Add form submission logic here (e.g., call an API)
    console.log('Form submitted:', formData);
  };

  const content = (
    <div className="max-w-3xl mx-auto space-y-10 p-4">
      <Card padding="p-8" shadow={true} border={true}>
        <h1 className="text-2xl font-bold mb-6 text-center">Contact Us</h1>
        <p className="mb-6 text-sm text-center">
          We understand that running a security company demands reliable support. If you encounter any issues with our application or have suggestions to improve our service, please reach out—we’re here to help.
        </p>

        {/* Contact details in a single row with vertical stacking for each item */}
        <div className="flex flex-col md:flex-row justify-around items-center mb-8 space-y-4 md:space-y-0">
          <div className="flex flex-col items-center space-y-2">
            <FaEnvelope className="text-blue-600 text-2xl" />
            <h2 className="font-semibold text-lg">Email</h2>
            <a href="mailto:support@vravenz.com" className="text-sm underline">
              support@vravenz.com
            </a>
          </div>
          <div className="flex flex-col items-center space-y-2">
            <FaPhone className="text-green-600 text-2xl" />
            <h2 className="font-semibold text-lg">Phone</h2>
            <p className="text-sm">+44 20 7946 0991</p>
          </div>
          <div className="flex flex-col items-center space-y-2">
            <FaMapMarkerAlt className="text-red-600 text-2xl" />
            <h2 className="font-semibold text-lg">Address</h2>
            <p className="text-sm text-center">Business Park, London, UK</p>
          </div>
        </div>

        {/* Contact Form */}
        <div className="mt-10">
          <h2 className="text-xl font-semibold text-center mb-4">Send Us a Message</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <InputField
              type="select"
              name="messageType"
              value={formData.messageType}
              onChange={handleChange}
              label="Message Type"
              required
              options={[
                { label: 'General Inquiry', value: 'inquiry' },
                { label: 'Suggestion', value: 'suggestion' },
                { label: 'Complaint', value: 'complaint' },
              ]}
              placeholder="Select Message Type"
            />
            <InputField
              type="text"
              name="subject"
              value={formData.subject}
              onChange={handleChange}
              label="Subject"
              required
            />
            <InputField
              type="textarea"
              name="message"
              value={formData.message}
              onChange={handleChange}
              label="Message"
              required
            />
            <div className="flex justify-end">
              <Button type="submit" icon="send" size="small" color="submit" marginRight="5px">
                Submit
              </Button>
            </div>
          </form>
        </div>
      </Card>
    </div>
  );

  return (
    <div
      className={`flex flex-col min-h-screen ${
        theme === 'dark'
          ? 'bg-dark-background text-dark-text'
          : 'bg-light-background text-light-text'
      }`}
    >
      <Navbar />
      <OneColumnLayout content={content} />
      <Footer />
    </div>
  );
};

export default ContactUsPage;
