// pages/protected/terms-and-conditions/TermsAndConditionsPage.tsx

import React, { useEffect } from 'react';
import { FaCheck, FaRegCircle, FaCalendarAlt, FaMapMarkerAlt, FaPhone } from 'react-icons/fa';
import Card from '../../../components/Card';
import OneColumnLayout from '../../../components/OneColumnLayout';
import Navbar from '../../../components/Navbar';
import Footer from '../../../components/Footer';
import { useTheme } from '../../../context/ThemeContext';

const TermsAndConditionsPage: React.FC = () => {
  const { theme } = useTheme();

  // Scroll to top when the component mounts
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Define the main content with extra sections, icons, and extended dummy content
  const content = (
    <div className="max-w-3xl mx-auto space-y-10">
      <Card padding="p-8" shadow={true} border={true}>
        <h1 className="text-4xl font-bold mb-6 text-center">Terms and Conditions</h1>
        <div className="prose prose-lg">
          <p className="mb-6 text-sm">
            Welcome to our website. These Terms and Conditions outline the rules and regulations for the use of our service. By accessing this website, you agree to accept these terms in full.
          </p>
          
          <h2 className="mt-8 mb-4 font-semibold">1. Introduction</h2>
          <p className="mb-6 text-sm">
            Lorem ipsum dolor sit amet, consectetur adipiscing elit. Curabitur vel diam ac leo malesuada interdum. In euismod, quam ac tristique fermentum, felis sapien sollicitudin nisi, in gravida ligula neque in enim. Nulla facilisi. Donec euismod neque non dolor suscipit, nec vehicula nisi suscipit. Lorem ipsum dolor sit amet, consectetur adipiscing elit.
          </p>
          
          <h3 className="mt-6 mb-3 font-semibold">1.1 Overview</h3>
          <p className="mb-6 text-sm">
            Mauris ut ante at ligula pretium condimentum. Vestibulum ante ipsum primis in faucibus orci luctus et ultrices posuere cubilia curae; Integer at ante id risus consequat molestie.
          </p>
          <ul className="mb-6 list-none ml-0 space-y-3 text-sm">
            <li className="flex items-center">
              <FaCheck className="text-green-600 mr-2" />
              First important point about our service.
            </li>
            <li className="flex items-center">
              <FaCheck className="text-green-600 mr-2" />
              Another key factor you should consider.
            </li>
            <li className="flex items-center">
              <FaCheck className="text-green-600 mr-2" />
              Further details on the overview.
            </li>
          </ul>

          <h2 className="mt-8 mb-4 font-semibold">2. User Obligations</h2>
          <p className="mb-6 text-sm">
            Vivamus euismod mauris et arcu vulputate, non sodales purus eleifend. Users are expected to adhere to the following rules:
          </p>
          <h3 className="mt-6 mb-3 font-semibold">2.1 Registration</h3>
          <p className="mb-6 text-sm">
            Sed bibendum magna a turpis consectetur, at elementum nisi luctus. By registering on our platform, you agree to provide accurate and up-to-date information.
          </p>
          <ol className="mb-6 list-none ml-0 space-y-3 text-sm">
            <li className="flex items-center">
              <FaRegCircle className="text-blue-600 mr-2" />
              You must be at least 18 years old.
            </li>
            <li className="flex items-center">
              <FaRegCircle className="text-blue-600 mr-2" />
              You are responsible for maintaining the confidentiality.
            </li>
            <li className="flex items-center">
              <FaRegCircle className="text-blue-600 mr-2" />
              Any misuse of your account is your responsibility.
            </li>
          </ol>

          <h2 className="mt-8 mb-4 font-semibold">3. Limitation of Liability</h2>
          <p className="mb-6 text-sm">
            Phasellus sit amet nibh turpis. Vestibulum ac semper metus. Duis tincidunt, risus at fringilla vehicula, lorem justo tristique arcu, vitae cursus risus lacus vitae felis. Pellentesque habitant morbi tristique senectus et netus et malesuada fames ac turpis egestas.
          </p>
          <p className="mb-6 text-sm">
            Morbi tempus felis a libero tincidunt, ac varius nulla posuere. Proin euismod diam ut erat volutpat, nec scelerisque sapien sollicitudin. Aenean tempus nibh et erat blandit, in egestas nisl suscipit.
          </p>

          <h2 className="mt-8 mb-4 font-semibold">4. Governing Law</h2>
          <p className="mb-6 text-sm">
            Suspendisse potenti. Donec eget lacus vitae libero suscipit feugiat. Vivamus vehicula faucibus lorem, vitae fringilla lectus finibus in. Duis blandit lacus non tellus tristique, ac commodo sapien commodo.
          </p>
          
          <h3 className="mt-6 mb-3 font-semibold">4.1 Jurisdiction</h3>
          <p className="mb-6 text-sm">
            By using this website, you agree that the laws of the jurisdiction in which our company operates shall govern these Terms and Conditions.
          </p>

          <h2 className="mt-8 mb-4 font-semibold">5. Amendments and Updates</h2>
          <p className="mb-6 text-sm">
            These Terms and Conditions may be updated from time to time without prior notice. It is your responsibility to review these terms periodically to stay informed about any changes.
          </p>

          <h2 className="mt-8 mb-4 font-semibold">6. Contact Information</h2>
          <p className="mb-6 text-sm">
            If you have any questions regarding these Terms and Conditions, please contact us at <a href="mailto:support@example.com">support@example.com</a>.
          </p>

          {/* Extra Content with Additional Icons */}
          <h2 className="mt-8 mb-4 font-semibold">7. Effective Date &amp; Location</h2>
          <p className="mb-6 text-sm flex items-center">
            <FaCalendarAlt className="text-purple-600 mr-2" />
            <span>Effective Date: January 1, 2025</span>
          </p>
          <p className="mb-6 text-sm flex items-center">
            <FaMapMarkerAlt className="text-red-600 mr-2" />
            <span>Location: 1234 Main Street, Anytown, United Kingdom</span>
          </p>
          <p className="mb-6 text-sm flex items-center">
            <FaPhone className="text-blue-600 mr-2" />
            <span>Contact Number: (123) 456-7890</span>
          </p>

          <h2 className="mt-8 mb-4 font-semibold">8. Additional Provisions</h2>
          <p className="mb-6 text-sm">
            Lorem ipsum dolor sit amet, consectetur adipiscing elit. Quisque aliquet, nibh at convallis aliquam, nunc neque fermentum est, vitae volutpat nisi purus in dui. Donec convallis sollicitudin ligula, vitae suscipit urna molestie id. Sed interdum, nunc nec luctus aliquet, ligula metus varius nibh, non semper enim metus a orci.
          </p>
          <p className="mb-6 text-sm">
            Aenean id libero et nisi hendrerit bibendum. Mauris vitae malesuada eros. Proin tincidunt felis a lorem tempor, sed congue lacus congue. Suspendisse potenti. Phasellus mollis lacus eu metus ultrices, vel imperdiet sapien porttitor.
          </p>
          <p className="mb-6 text-sm">
            In hac habitasse platea dictumst. Aliquam erat volutpat. Etiam vel lectus non sem porta consequat. Integer at felis sit amet tortor vehicula dictum. Donec ut dolor vitae nunc imperdiet fermentum. Nam faucibus lacus vel lacus ullamcorper, in hendrerit lorem condimentum.
          </p>
          
          <p className="mt-8 text-sm">
            <strong>Last Updated:</strong> January 1, 2025.
          </p>
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

export default TermsAndConditionsPage;
