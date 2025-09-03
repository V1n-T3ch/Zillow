import { useState, useEffect, useRef } from 'react';
import { FiUser, FiMail, FiPhone, FiEdit2, FiSave, FiCamera, FiAlertCircle, FiX, FiSettings, FiTrash2, FiLock, FiMapPin, FiCheckCircle } from 'react-icons/fi';
import DashboardLayout from '../../../components/dashboard/DashboardLayout';
import { useAuth } from '../../../hooks/useAuth';
import { updateProfile, EmailAuthProvider, reauthenticateWithCredential, updatePassword, deleteUser } from 'firebase/auth';
import { doc, updateDoc, deleteDoc, query, collection, where, getDocs } from 'firebase/firestore';
import { db, storage } from '../../../firebase';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { useNavigate } from 'react-router-dom';

const UserProfile = () => {
    const navigate = useNavigate();
    const { currentUser, userDetails, fetchUserDetails } = useAuth();
    const [editing, setEditing] = useState(false);
    const [loading, setLoading] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');
    const [errorMessage, setErrorMessage] = useState('');
    const fileInputRef = useRef(null);

    // Image upload state
    const [uploadProgress, setUploadProgress] = useState(0);
    const [isUploading, setIsUploading] = useState(false);

    // Password change modal state
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [passwordData, setPasswordData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });
    const [passwordError, setPasswordError] = useState('');

    // Notification settings modal state
    const [showNotificationsModal, setShowNotificationsModal] = useState(false);
    const [notificationSettings, setNotificationSettings] = useState({
        emailNotifications: true,
        appNotifications: true,
        marketingEmails: false,
        propertyAlerts: true,
        bookingReminders: true
    });

    // Account deletion modal state
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deleteConfirmation, setDeleteConfirmation] = useState('');
    const [deletePassword, setDeletePassword] = useState('');

    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        address: '',
        bio: ''
    });

    useEffect(() => {
        if (currentUser && userDetails) {
            setFormData({
                name: currentUser.displayName || '',
                email: currentUser.email || '',
                phone: userDetails.phone || '',
                address: userDetails.address || '',
                bio: userDetails.bio || ''
            });

            // Initialize notification settings from userDetails if available
            if (userDetails.notificationSettings) {
                setNotificationSettings(userDetails.notificationSettings);
            }
        }
    }, [currentUser, userDetails]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setErrorMessage('');
        setSuccessMessage('');

        try {
            // Basic validation
            if (!formData.name.trim()) {
                throw new Error('Name is required');
            }

            if (formData.phone && !/^[+]?[(]?[0-9]{3}[)]?[-\s.]?[0-9]{3}[-\s.]?[0-9]{4,6}$/im.test(formData.phone)) {
                throw new Error('Please enter a valid phone number');
            }

            // Update auth profile
            if (currentUser.displayName !== formData.name) {
                await updateProfile(currentUser, {
                    displayName: formData.name
                });
            }

            // Update firestore document
            const userRef = doc(db, 'users', currentUser.uid);
            await updateDoc(userRef, {
                name: formData.name,
                phone: formData.phone,
                address: formData.address,
                bio: formData.bio,
                updatedAt: new Date()
            });

            // Refresh user data
            await fetchUserDetails(currentUser.uid);

            setSuccessMessage('Profile updated successfully!');
            setEditing(false);

            // Clear success message after 3 seconds
            setTimeout(() => {
                setSuccessMessage('');
            }, 3000);
        } catch (error) {
            console.error('Error updating profile:', error);
            setErrorMessage(error.message || 'Failed to update profile. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    // Handle profile photo upload
    const handlePhotoClick = () => {
        fileInputRef.current.click();
    };

    const handleFileChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Validate file type
        const validTypes = ['image/jpeg', 'image/png', 'image/gif'];
        if (!validTypes.includes(file.type)) {
            setErrorMessage('Please upload a valid image file (JPEG, PNG, or GIF)');
            return;
        }

        // Validate file size (max 2MB)
        if (file.size > 2 * 1024 * 1024) {
            setErrorMessage('Image size should be less than 2MB');
            return;
        }

        try {
            setIsUploading(true);
            setUploadProgress(0);

            // Create a storage reference
            const storageRef = ref(storage, `profile-photos/${currentUser.uid}/${Date.now()}-${file.name}`);

            // Upload file with progress tracking
            const uploadTask = uploadBytesResumable(storageRef, file);

            uploadTask.on('state_changed',
                (snapshot) => {
                    // Track upload progress
                    const progress = Math.round(
                        (snapshot.bytesTransferred / snapshot.totalBytes) * 100
                    );
                    setUploadProgress(progress);
                },
                (error) => {
                    console.error('Error uploading image:', error);
                    setIsUploading(false);
                    setErrorMessage('Failed to upload image. Please try again.');
                },
                async () => {
                    // Upload completed successfully
                    const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);

                    // Update user profile in Firebase Auth
                    await updateProfile(currentUser, {
                        photoURL: downloadURL
                    });

                    // Update photoURL in Firestore
                    const userRef = doc(db, 'users', currentUser.uid);
                    await updateDoc(userRef, {
                        photoURL: downloadURL,
                        updatedAt: new Date()
                    });

                    // Refresh user data
                    await fetchUserDetails(currentUser.uid);

                    setIsUploading(false);
                    setSuccessMessage('Profile photo updated successfully!');

                    // Clear success message after 3 seconds
                    setTimeout(() => {
                        setSuccessMessage('');
                    }, 3000);
                }
            );
        } catch (error) {
            console.error('Error handling file upload:', error);
            setIsUploading(false);
            setErrorMessage('Failed to process image. Please try again.');
        }
    };

    // Password change handlers
    const handlePasswordChange = (e) => {
        const { name, value } = e.target;
        setPasswordData(prev => ({ ...prev, [name]: value }));
    };

    const handlePasswordSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setPasswordError('');

        try {
            // Validate password inputs
            if (!passwordData.currentPassword) {
                throw new Error('Current password is required');
            }

            if (!passwordData.newPassword) {
                throw new Error('New password is required');
            }

            if (passwordData.newPassword.length < 6) {
                throw new Error('New password must be at least 6 characters');
            }

            if (passwordData.newPassword !== passwordData.confirmPassword) {
                throw new Error('New passwords do not match');
            }

            // Re-authenticate user before changing password
            const credential = EmailAuthProvider.credential(
                currentUser.email,
                passwordData.currentPassword
            );

            await reauthenticateWithCredential(currentUser, credential);

            // Update password
            await updatePassword(currentUser, passwordData.newPassword);

            // Reset form and close modal
            setPasswordData({
                currentPassword: '',
                newPassword: '',
                confirmPassword: ''
            });
            setShowPasswordModal(false);
            setSuccessMessage('Password changed successfully!');

            // Clear success message after 3 seconds
            setTimeout(() => {
                setSuccessMessage('');
            }, 3000);
        } catch (error) {
            console.error('Error changing password:', error);

            // Handle specific Firebase auth errors
            if (error.code === 'auth/wrong-password') {
                setPasswordError('Current password is incorrect');
            } else if (error.code === 'auth/too-many-requests') {
                setPasswordError('Too many unsuccessful attempts. Please try again later.');
            } else {
                setPasswordError(error.message || 'Failed to change password. Please try again.');
            }
        } finally {
            setLoading(false);
        }
    };

    // Notification settings handlers
    const handleNotificationChange = (e) => {
        const { name, checked } = e.target;
        setNotificationSettings(prev => ({ ...prev, [name]: checked }));
    };

    const handleNotificationSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            // Update notification settings in Firestore
            const userRef = doc(db, 'users', currentUser.uid);
            await updateDoc(userRef, {
                notificationSettings,
                updatedAt: new Date()
            });

            // Refresh user data
            await fetchUserDetails(currentUser.uid);

            setShowNotificationsModal(false);
            setSuccessMessage('Notification preferences updated successfully!');

            // Clear success message after 3 seconds
            setTimeout(() => {
                setSuccessMessage('');
            }, 3000);
        } catch (error) {
            console.error('Error updating notification settings:', error);
            setErrorMessage('Failed to update notification settings. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    // Account deletion handlers
    const handleDeleteAccount = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            // Validate delete confirmation
            if (deleteConfirmation !== 'DELETE') {
                throw new Error('Please type DELETE to confirm account deletion');
            }

            if (!deletePassword) {
                throw new Error('Please enter your password to confirm deletion');
            }

            // Re-authenticate user before deletion
            const credential = EmailAuthProvider.credential(
                currentUser.email,
                deletePassword
            );

            await reauthenticateWithCredential(currentUser, credential);

            // Delete user data from Firestore
            await deleteDoc(doc(db, 'users', currentUser.uid));

            // Delete saved properties (favorites)
            const deleteFavorites = async () => {
                const favoritesQuery = query(
                    collection(db, 'favorites'),
                    where('userId', '==', currentUser.uid)
                );
                const favoritesSnapshot = await getDocs(favoritesQuery);
                const deletePromises = favoritesSnapshot.docs.map(doc => deleteDoc(doc.ref));
                await Promise.all(deletePromises);
            };

            // Delete bookings
            const deleteBookings = async () => {
                const bookingsQuery = query(
                    collection(db, 'bookings'),
                    where('userId', '==', currentUser.uid)
                );
                const bookingsSnapshot = await getDocs(bookingsQuery);
                const deletePromises = bookingsSnapshot.docs.map(doc => deleteDoc(doc.ref));
                await Promise.all(deletePromises);
            };

            // Run deletion tasks
            await Promise.all([deleteFavorites(), deleteBookings()]);

            // Delete user from Firebase Auth (must be last)
            await deleteUser(currentUser);

            // Redirect to home page
            navigate('/');
        } catch (error) {
            console.error('Error deleting account:', error);

            // Handle specific Firebase auth errors
            if (error.code === 'auth/wrong-password') {
                setErrorMessage('Password is incorrect');
            } else {
                setErrorMessage(error.message || 'Failed to delete account. Please try again.');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <DashboardLayout role="user">
            <div>
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-gray-800">My Profile</h2>
                    <button
                        onClick={() => setEditing(!editing)}
                        className={`flex items-center px-4 py-2 rounded-lg ${editing
                            ? 'bg-gray-200 text-gray-700'
                            : 'bg-emerald-50 text-emerald-700'
                            }`}
                    >
                        {editing ? (
                            <>
                                <FiX className="mr-2" /> Cancel
                            </>
                        ) : (
                            <>
                                <FiEdit2 className="mr-2" /> Edit Profile
                            </>
                        )}
                    </button>
                </div>

                {successMessage && (
                    <div className="mb-4 p-3 bg-green-50 text-green-800 rounded-lg flex items-center justify-between">
                        <div className="flex items-center">
                            <FiCheckCircle className="mr-2" size={18} />
                            {successMessage}
                        </div>
                        <button onClick={() => setSuccessMessage('')} className="text-green-700">
                            <FiX size={18} />
                        </button>
                    </div>
                )}

                {errorMessage && (
                    <div className="mb-4 p-3 bg-red-50 text-red-800 rounded-lg flex items-center justify-between">
                        <div className="flex items-center">
                            <FiAlertCircle className="mr-2" size={18} />
                            {errorMessage}
                        </div>
                        <button onClick={() => setErrorMessage('')} className="text-red-700">
                            <FiX size={18} />
                        </button>
                    </div>
                )}

                <div className="bg-white p-6 rounded-xl shadow-sm mb-6">
                    <div className="flex flex-col sm:flex-row items-center sm:items-start mb-6">
                        <div className="relative mb-4 sm:mb-0 sm:mr-6">
                            <div className="w-24 h-24 rounded-full bg-emerald-100 flex items-center justify-center overflow-hidden">
                                {isUploading ? (
                                    <div className="w-full h-full flex items-center justify-center bg-gray-200">
                                        <div className="text-center">
                                            <div className="h-4 w-16 bg-gray-300 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-emerald-500"
                                                    style={{ width: `${uploadProgress}%` }}
                                                ></div>
                                            </div>
                                            <div className="text-xs mt-1 text-gray-600">{uploadProgress}%</div>
                                        </div>
                                    </div>
                                ) : currentUser?.photoURL ? (
                                    <img
                                        src={currentUser.photoURL}
                                        alt={formData.name}
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <span className="text-emerald-700 text-3xl font-bold">
                                        {formData.name ? formData.name.charAt(0).toUpperCase() : 'U'}
                                    </span>
                                )}
                            </div>

                            {editing && (
                                <button
                                    className="absolute bottom-0 right-0 bg-white p-1.5 rounded-full shadow-md border border-gray-200 text-gray-700 hover:text-emerald-600"
                                    onClick={handlePhotoClick}
                                >
                                    <FiCamera size={18} />
                                </button>
                            )}
                            <input
                                type="file"
                                ref={fileInputRef}
                                className="hidden"
                                accept="image/jpeg, image/png, image/gif"
                                onChange={handleFileChange}
                            />
                        </div>

                        <div className="text-center sm:text-left">
                            <h3 className="text-xl font-bold text-gray-800 mb-1">{formData.name || 'User'}</h3>
                            <p className="text-gray-600 mb-2">{formData.email}</p>
                            <div className="inline-block px-3 py-1 bg-emerald-100 text-emerald-800 text-xs rounded-full">
                                {userDetails?.role || 'User'}
                            </div>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit}>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-gray-700 text-sm font-medium mb-2" htmlFor="name">
                                    Full Name
                                </label>
                                <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden">
                                    <div className="bg-gray-50 p-3 text-gray-400">
                                        <FiUser />
                                    </div>
                                    <input
                                        id="name"
                                        name="name"
                                        type="text"
                                        value={formData.name}
                                        onChange={handleChange}
                                        disabled={!editing}
                                        className={`block w-full p-3 focus:outline-none ${editing ? 'bg-white' : 'bg-gray-50'}`}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-gray-700 text-sm font-medium mb-2" htmlFor="email">
                                    Email Address
                                </label>
                                <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden">
                                    <div className="bg-gray-50 p-3 text-gray-400">
                                        <FiMail />
                                    </div>
                                    <input
                                        id="email"
                                        name="email"
                                        type="email"
                                        value={formData.email}
                                        disabled
                                        className="block w-full p-3 bg-gray-50 focus:outline-none"
                                    />
                                </div>
                                <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
                            </div>

                            <div>
                                <label className="block text-gray-700 text-sm font-medium mb-2" htmlFor="phone">
                                    Phone Number
                                </label>
                                <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden">
                                    <div className="bg-gray-50 p-3 text-gray-400">
                                        <FiPhone />
                                    </div>
                                    <input
                                        id="phone"
                                        name="phone"
                                        type="tel"
                                        value={formData.phone}
                                        onChange={handleChange}
                                        disabled={!editing}
                                        className={`block w-full p-3 focus:outline-none ${editing ? 'bg-white' : 'bg-gray-50'}`}
                                        placeholder="(123) 456-7890"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-gray-700 text-sm font-medium mb-2" htmlFor="address">
                                    Address
                                </label>
                                <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden">
                                    <div className="bg-gray-50 p-3 text-gray-400">
                                        <FiMapPin />
                                    </div>
                                    <input
                                        id="address"
                                        name="address"
                                        type="text"
                                        value={formData.address}
                                        onChange={handleChange}
                                        disabled={!editing}
                                        className={`block w-full p-3 focus:outline-none ${editing ? 'bg-white' : 'bg-gray-50'}`}
                                    />
                                </div>
                            </div>

                            <div className="md:col-span-2">
                                <label className="block text-gray-700 text-sm font-medium mb-2" htmlFor="bio">
                                    Bio
                                </label>
                                <textarea
                                    id="bio"
                                    name="bio"
                                    rows="3"
                                    value={formData.bio}
                                    onChange={handleChange}
                                    disabled={!editing}
                                    className={`block w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 ${editing ? 'bg-white' : 'bg-gray-50'}`}
                                    placeholder="Tell us a little about yourself"
                                />
                            </div>
                        </div>

                        {editing && (
                            <div className="mt-6 flex justify-end">
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="flex items-center px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 disabled:bg-emerald-300 disabled:cursor-not-allowed"
                                >
                                    {loading ? (
                                        <span>Saving...</span>
                                    ) : (
                                        <>
                                            <FiSave className="mr-2" /> Save Changes
                                        </>
                                    )}
                                </button>
                            </div>
                        )}
                    </form>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm">
                    <h3 className="text-lg font-bold text-gray-800 mb-4">Account Settings</h3>

                    <div className="space-y-4">
                        <div className="p-4 border border-gray-200 rounded-lg flex justify-between items-center">
                            <div>
                                <h4 className="font-medium text-gray-800">Change Password</h4>
                                <p className="text-sm text-gray-600">Update your password for enhanced security</p>
                            </div>
                            <button
                                onClick={() => setShowPasswordModal(true)}
                                className="px-4 py-2 bg-gray-100 text-gray-800 rounded-lg hover:bg-gray-200 flex items-center"
                            >
                                <FiLock className="mr-2" /> Change
                            </button>
                        </div>

                        <div className="p-4 border border-gray-200 rounded-lg flex justify-between items-center">
                            <div>
                                <h4 className="font-medium text-gray-800">Notification Settings</h4>
                                <p className="text-sm text-gray-600">Manage your email and app notifications</p>
                            </div>
                            <button
                                onClick={() => setShowNotificationsModal(true)}
                                className="px-4 py-2 bg-gray-100 text-gray-800 rounded-lg hover:bg-gray-200 flex items-center"
                            >
                                <FiSettings className="mr-2" /> Configure
                            </button>
                        </div>

                        <div className="p-4 border border-gray-200 rounded-lg flex justify-between items-center">
                            <div>
                                <h4 className="font-medium text-red-600">Delete Account</h4>
                                <p className="text-sm text-gray-600">Permanently delete your account and all data</p>
                            </div>
                            <button
                                onClick={() => setShowDeleteModal(true)}
                                className="px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 flex items-center"
                            >
                                <FiTrash2 className="mr-2" /> Delete
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Password Change Modal */}
            {showPasswordModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-lg max-w-md w-full p-6">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-xl font-bold text-gray-800">Change Password</h3>
                            <button
                                onClick={() => setShowPasswordModal(false)}
                                className="text-gray-500 hover:text-gray-700"
                            >
                                <FiX size={24} />
                            </button>
                        </div>

                        {passwordError && (
                            <div className="mb-4 p-3 bg-red-50 text-red-800 rounded-lg text-sm">
                                {passwordError}
                            </div>
                        )}

                        <form onSubmit={handlePasswordSubmit}>
                            <div className="mb-4">
                                <label className="block text-gray-700 text-sm font-medium mb-2" htmlFor="currentPassword">
                                    Current Password
                                </label>
                                <input
                                    id="currentPassword"
                                    name="currentPassword"
                                    type="password"
                                    value={passwordData.currentPassword}
                                    onChange={handlePasswordChange}
                                    required
                                    className="block w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                />
                            </div>

                            <div className="mb-4">
                                <label className="block text-gray-700 text-sm font-medium mb-2" htmlFor="newPassword">
                                    New Password
                                </label>
                                <input
                                    id="newPassword"
                                    name="newPassword"
                                    type="password"
                                    value={passwordData.newPassword}
                                    onChange={handlePasswordChange}
                                    required
                                    minLength={6}
                                    className="block w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                />
                                <p className="text-xs text-gray-500 mt-1">Password must be at least 6 characters</p>
                            </div>

                            <div className="mb-6">
                                <label className="block text-gray-700 text-sm font-medium mb-2" htmlFor="confirmPassword">
                                    Confirm New Password
                                </label>
                                <input
                                    id="confirmPassword"
                                    name="confirmPassword"
                                    type="password"
                                    value={passwordData.confirmPassword}
                                    onChange={handlePasswordChange}
                                    required
                                    className="block w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                />
                            </div>

                            <div className="flex justify-end">
                                <button
                                    type="button"
                                    onClick={() => setShowPasswordModal(false)}
                                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 mr-2"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 disabled:bg-emerald-300 disabled:cursor-not-allowed"
                                >
                                    {loading ? 'Updating...' : 'Update Password'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Notification Settings Modal */}
            {showNotificationsModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-lg max-w-md w-full p-6">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-xl font-bold text-gray-800">Notification Settings</h3>
                            <button
                                onClick={() => setShowNotificationsModal(false)}
                                className="text-gray-500 hover:text-gray-700"
                            >
                                <FiX size={24} />
                            </button>
                        </div>

                        <form onSubmit={handleNotificationSubmit}>
                            <div className="space-y-4 mb-6">
                                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                    <div>
                                        <h4 className="font-medium text-gray-800">Email Notifications</h4>
                                        <p className="text-sm text-gray-600">Receive notifications via email</p>
                                    </div>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input
                                            type="checkbox"
                                            name="emailNotifications"
                                            checked={notificationSettings.emailNotifications}
                                            onChange={handleNotificationChange}
                                            className="sr-only peer"
                                        />
                                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-emerald-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                                    </label>
                                </div>

                                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                    <div>
                                        <h4 className="font-medium text-gray-800">App Notifications</h4>
                                        <p className="text-sm text-gray-600">Receive in-app notifications</p>
                                    </div>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input
                                            type="checkbox"
                                            name="appNotifications"
                                            checked={notificationSettings.appNotifications}
                                            onChange={handleNotificationChange}
                                            className="sr-only peer"
                                        />
                                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-emerald-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                                    </label>
                                </div>

                                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                    <div>
                                        <h4 className="font-medium text-gray-800">Marketing Emails</h4>
                                        <p className="text-sm text-gray-600">Receive promotional content and offers</p>
                                    </div>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input
                                            type="checkbox"
                                            name="marketingEmails"
                                            checked={notificationSettings.marketingEmails}
                                            onChange={handleNotificationChange}
                                            className="sr-only peer"
                                        />
                                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-emerald-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                                    </label>
                                </div>

                                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                    <div>
                                        <h4 className="font-medium text-gray-800">Property Alerts</h4>
                                        <p className="text-sm text-gray-600">Get notified about new matching properties</p>
                                    </div>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input
                                            type="checkbox"
                                            name="propertyAlerts"
                                            checked={notificationSettings.propertyAlerts}
                                            onChange={handleNotificationChange}
                                            className="sr-only peer"
                                        />
                                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-emerald-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                                    </label>
                                </div>

                                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                    <div>
                                        <h4 className="font-medium text-gray-800">Booking Reminders</h4>
                                        <p className="text-sm text-gray-600">Receive reminders about upcoming viewings</p>
                                    </div>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input
                                            type="checkbox"
                                            name="bookingReminders"
                                            checked={notificationSettings.bookingReminders}
                                            onChange={handleNotificationChange}
                                            className="sr-only peer"
                                        />
                                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-emerald-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                                    </label>
                                </div>
                            </div>

                            <div className="flex justify-end">
                                <button
                                    type="button"
                                    onClick={() => setShowNotificationsModal(false)}
                                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 mr-2"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 disabled:bg-emerald-300 disabled:cursor-not-allowed"
                                >
                                    {loading ? 'Saving...' : 'Save Preferences'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Account Deletion Modal */}
            {showDeleteModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-lg max-w-md w-full p-6">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-xl font-bold text-red-600">Delete Account</h3>
                            <button
                                onClick={() => setShowDeleteModal(false)}
                                className="text-gray-500 hover:text-gray-700"
                            >
                                <FiX size={24} />
                            </button>
                        </div>

                        <div className="mb-6">
                            <div className="p-4 bg-red-50 text-red-800 rounded-lg mb-4">
                                <h4 className="font-medium mb-2">Warning: This action cannot be undone</h4>
                                <p className="text-sm">Deleting your account will permanently remove all your data, including:</p>
                                <ul className="list-disc list-inside text-sm mt-2 space-y-1">
                                    <li>Your profile information</li>
                                    <li>Saved properties</li>
                                    <li>Booking history</li>
                                    <li>Messages and communication history</li>
                                </ul>
                            </div>

                            {errorMessage && (
                                <div className="mb-4 p-3 bg-red-50 text-red-800 rounded-lg text-sm">
                                    {errorMessage}
                                </div>
                            )}

                            <form onSubmit={handleDeleteAccount}>
                                <div className="mb-4">
                                    <label className="block text-gray-700 text-sm font-medium mb-2">
                                        Type "DELETE" to confirm
                                    </label>
                                    <input
                                        type="text"
                                        value={deleteConfirmation}
                                        onChange={(e) => setDeleteConfirmation(e.target.value)}
                                        className="block w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                                        placeholder="DELETE"
                                    />
                                </div>

                                <div className="mb-4">
                                    <label className="block text-gray-700 text-sm font-medium mb-2">
                                        Enter your password
                                    </label>
                                    <input
                                        type="password"
                                        value={deletePassword}
                                        onChange={(e) => setDeletePassword(e.target.value)}
                                        required
                                        className="block w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                                        placeholder="Your current password"
                                    />
                                </div>

                                <div className="flex justify-end">
                                    <button
                                        type="button"
                                        onClick={() => setShowDeleteModal(false)}
                                        className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 mr-2"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={loading || deleteConfirmation !== 'DELETE' || !deletePassword}
                                        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:bg-red-300 disabled:cursor-not-allowed"
                                    >
                                        {loading ? 'Deleting...' : 'Delete My Account'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </DashboardLayout>
    );
};

export default UserProfile;