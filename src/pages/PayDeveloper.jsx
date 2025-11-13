import { useState } from 'react';
import { FiAlertCircle, FiClock, FiDollarSign, FiMail, FiPhone, FiCheckCircle } from 'react-icons/fi';
import { Link } from 'react-router-dom';

const PayDeveloper = () => {
    const [copied, setCopied] = useState(false);
    const paymentDetails = {
        amount: 'Ksh. 10,000',
        dueDate: 'November 10, 2024',
        daysOverdue: 3,
        mpesaNumber: '+254 112 713 070',
        mpesaName: 'Vincent Wambui',
        bankAccount: '1319047807',
        bankName: 'KCB Bank',
        email: 'vincegichomo704@gmail.com'
    };

    const handleCopyMpesa = () => {
        navigator.clipboard.writeText(paymentDetails.mpesaNumber.replace(/\s/g, ''));
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50">
            <div className="flex items-center justify-center min-h-screen px-4 py-12">
                <div className="w-full max-w-2xl">
                    {/* Warning Banner */}
                    <div className="p-4 mb-6 border-l-4 border-red-500 rounded-lg shadow-lg bg-red-50">
                        <div className="flex items-center">
                            <FiAlertCircle className="mr-3 text-red-600" size={24} />
                            <div>
                                <p className="font-semibold text-red-800">Payment Overdue</p>
                                <p className="text-sm text-red-600">
                                    This website will be taken offline if payment is not received within 48 hours
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Main Payment Card */}
                    <div className="overflow-hidden bg-white shadow-2xl rounded-2xl">
                        {/* Header */}
                        <div className="p-6 text-white bg-gradient-to-r from-red-600 to-orange-600">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h1 className="mb-2 text-3xl font-bold">Payment Required</h1>
                                    <p className="text-red-100">Development Services - Dwella Platform</p>
                                </div>
                                <div className="p-4 rounded-full bg-opacity-20">
                                    <FiDollarSign size={32} />
                                </div>
                            </div>
                        </div>

                        {/* Content */}
                        <div className="p-8">
                            {/* Amount Due */}
                            <div className="p-6 mb-6 text-center border-2 border-orange-200 rounded-xl bg-orange-50">
                                <p className="mb-2 text-sm font-medium text-gray-600">Amount Due</p>
                                <p className="mb-1 text-4xl font-bold text-gray-900">{paymentDetails.amount}</p>
                                <p className="text-sm text-gray-600">Original Due Date: {paymentDetails.dueDate}</p>
                            </div>

                            {/* Overdue Notice */}
                            <div className="flex items-center justify-center p-4 mb-6 border border-yellow-300 rounded-lg bg-yellow-50">
                                <FiClock className="mr-2 text-yellow-600" size={20} />
                                <p className="font-semibold text-yellow-800">
                                    {paymentDetails.daysOverdue} days overdue
                                </p>
                            </div>

                            {/* Payment Instructions */}
                            <div className="mb-6">
                                <h2 className="mb-4 text-xl font-bold text-gray-800">Payment Instructions</h2>
                                
                                {/* M-Pesa */}
                                <div className="p-4 mb-4 transition-colors border-2 border-gray-200 rounded-lg hover:border-emerald-500">
                                    <div className="flex items-center justify-between mb-2">
                                        <h3 className="font-semibold text-gray-800">M-Pesa Payment</h3>
                                        <span className="px-2 py-1 text-xs font-semibold text-green-800 bg-green-100 rounded-full">
                                            Recommended
                                        </span>
                                    </div>
                                    <p className="mb-2 text-sm text-gray-600">Send payment to:</p>
                                    <div className="flex items-center justify-between p-3 rounded bg-gray-50">
                                        <div>
                                            <p className="font-mono text-lg font-bold text-gray-900">{paymentDetails.mpesaNumber}</p>
                                            <p className="text-sm text-gray-600">{paymentDetails.mpesaName}</p>
                                        </div>
                                        <button
                                            onClick={handleCopyMpesa}
                                            className="px-4 py-2 text-sm font-medium text-white transition-colors rounded-lg bg-emerald-600 hover:bg-emerald-700"
                                        >
                                            {copied ? (
                                                <span className="flex items-center">
                                                    <FiCheckCircle className="mr-1" /> Copied!
                                                </span>
                                            ) : (
                                                'Copy Number'
                                            )}
                                        </button>
                                    </div>
                                </div>

                                {/* Bank Transfer */}
                                <div className="p-4 border-2 border-gray-200 rounded-lg">
                                    <h3 className="mb-2 font-semibold text-gray-800">Bank Transfer</h3>
                                    <div className="space-y-2 text-sm">
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Bank:</span>
                                            <span className="font-medium text-gray-900">{paymentDetails.bankName}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Account:</span>
                                            <span className="font-mono font-medium text-gray-900">{paymentDetails.bankAccount}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Account Name:</span>
                                            <span className="font-medium text-gray-900">{paymentDetails.mpesaName}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Contact Information */}
                            <div className="p-4 mb-6 border-2 border-blue-200 rounded-lg bg-blue-50">
                                <h3 className="mb-3 font-semibold text-gray-800">Questions? Contact Developer</h3>
                                <div className="space-y-2">
                                    <a 
                                        href={`tel:${paymentDetails.mpesaNumber}`}
                                        className="flex items-center text-blue-700 transition-colors hover:text-blue-900"
                                    >
                                        <FiPhone className="mr-2" />
                                        {paymentDetails.mpesaNumber}
                                    </a>
                                    <a 
                                        href={`mailto:${paymentDetails.email}`}
                                        className="flex items-center text-blue-700 transition-colors hover:text-blue-900"
                                    >
                                        <FiMail className="mr-2" />
                                        {paymentDetails.email}
                                    </a>
                                </div>
                            </div>

                            {/* Warning Footer */}
                            <div className="p-4 text-center border-2 border-red-200 rounded-lg bg-red-50">
                                <p className="mb-2 font-semibold text-red-800">Important Notice</p>
                                <p className="text-sm text-red-700">
                                    Failure to make payment within 48 hours will result in immediate suspension 
                                    of all website services, including customer access and backend functionality.
                                </p>
                            </div>

                            {/* Action Button */}
                            <div className="mt-6 text-center">
                                <p className="mb-4 text-sm text-gray-600">
                                    After making payment, please notify us via phone or email
                                </p>
                                <Link
                                    to="/"
                                    className="inline-block px-6 py-3 text-white transition-colors rounded-lg bg-emerald-600 hover:bg-emerald-700"
                                >
                                    Return to Homepage
                                </Link>
                            </div>
                        </div>
                    </div>

                    {/* Bottom Notice */}
                    <div className="mt-6 text-center">
                        <p className="text-sm text-gray-600">
                            Website developed by Professional Developer | © 2024
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PayDeveloper;