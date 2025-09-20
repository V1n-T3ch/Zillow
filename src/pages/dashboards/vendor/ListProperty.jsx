import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiImage, FiDollarSign, FiHome, FiLayers, FiPlus, FiXCircle } from 'react-icons/fi';
import DashboardLayout from '../../../components/dashboard/DashboardLayout';
import { useAuth } from '../../../hooks/useAuth';
import { db } from '../../../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import axios from 'axios';

const ListProperty = () => {
    const { currentUser } = useAuth();
    const navigate = useNavigate();

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState('');
    const [uploadProgress, setUploadProgress] = useState(0);

    const [formData, setFormData] = useState({
        title: '',
        description: '',
        price: '',
        city: '',
        area: '',
        propertyType: '',
        listingStatus: '',
        beds: '',
        baths: '',
        yearBuilt: '',
        stories: '1',
        garage: '0',
        features: [],
        images: []
    });

    const [imageFiles, setImageFiles] = useState([]);
    const [imagePreviews, setImagePreviews] = useState([]);

    const propertyTypes = [
        'House', 'Apartment', 'Condo', 'Townhouse', 'Villa', 'Land', 'Commercial'
    ];
    
    const listingStatus = [
        'For Sale', 'For Rent'
    ];

    const possibleFeatures = [
        'Air Conditioning', 'Balcony', 'Dishwasher', 'Fireplace', 'Garden',
        'Gym', 'Hardwood Floors', 'Parking', 'Pool', 'Security System',
        'Waterfront', 'Pet Friendly', 'Smart Home', 'Storage', 'Walk-in Closet',
        'Furnished', 'Basement', 'Solar Panels', 'Elevator', 'Ocean View'
    ];

    const handleChange = (e) => {
        const { name, value } = e.target;

        // Handle number inputs
        if (['price', 'beds', 'baths', 'yearBuilt'].includes(name)) {
            const numberValue = value === '' ? '' : Number(value);
            setFormData({ ...formData, [name]: numberValue });
        } else {
            setFormData({ ...formData, [name]: value });
        }
    };

    const handleFeatureToggle = (feature) => {
        if (formData.features.includes(feature)) {
            setFormData({
                ...formData,
                features: formData.features.filter(f => f !== feature)
            });
        } else {
            setFormData({
                ...formData,
                features: [...formData.features, feature]
            });
        }
    };

    const handleImageChange = (e) => {
        const files = Array.from(e.target.files);

        // Create previews
        const newPreviews = files.map(file => URL.createObjectURL(file));
        setImagePreviews([...imagePreviews, ...newPreviews]);

        // Save files for upload
        setImageFiles([...imageFiles, ...files]);
    };

    const removeImage = (index) => {
        const newPreviews = [...imagePreviews];
        const newFiles = [...imageFiles];

        // Revoke object URL to avoid memory leaks
        URL.revokeObjectURL(newPreviews[index]);

        newPreviews.splice(index, 1);
        newFiles.splice(index, 1);

        setImagePreviews(newPreviews);
        setImageFiles(newFiles);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (imageFiles.length === 0) {
            setSubmitError('Please upload at least one image');
            return;
        }

        setIsSubmitting(true);
        setSubmitError('');

        try {
            // Upload images to B2 via backend
            const imageUrls = [];
            for (let i = 0; i < imageFiles.length; i++) {
                const file = imageFiles[i];
                const formData = new FormData();
                formData.append('image', file);

                // POST to your backend B2 server
                const res = await axios.post(
                    `${import.meta.env.REACT_APP_B2_API_URL || 'http://localhost:5000'}/api/images/upload`,
                    formData,
                    {
                        headers: {
                            'Content-Type': 'multipart/form-data'
                        }
                    }
                );

                if (res.data.status === 'success' && res.data.data?.fileUrl) {
                    imageUrls.push(res.data.data.fileUrl);
                } else {
                    throw new Error('Image upload failed');
                }

                setUploadProgress(Math.round(((i + 1) / imageFiles.length) * 100));
            }

            // Create property document in Firestore
            const propertyData = {
                ...formData,
                images: imageUrls,
                vendorId: currentUser.uid,
                vendorName: currentUser.displayName || 'Anonymous',
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
                views: 0,
                favorites: 0,
                status: 'pending' // Set initial status to pending for admin approval
            };

            const docRef = await addDoc(collection(db, 'properties'), propertyData);

            // Redirect to vendor properties with success parameter
            navigate(`/vendor/properties?success=true&propertyId=${docRef.id}`);

        } catch (error) {
            console.error('Error adding property:', error);
            setSubmitError('Failed to add property. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <DashboardLayout role="vendor">
            <div>
                <h2 className="mb-6 text-2xl font-bold text-gray-800">List a New Property</h2>

                {submitError && (
                    <div className="p-4 mb-6 text-red-700 rounded-lg bg-red-50">
                        {submitError}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-8">
                    {/* Basic Information */}
                    <div className="p-6 bg-white shadow-sm rounded-xl">
                        <h3 className="mb-4 text-lg font-bold text-gray-800">Basic Information</h3>

                        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                            <div className="md:col-span-2">
                                <label className="block mb-2 text-sm font-medium text-gray-700" htmlFor="title">
                                    Property Title *
                                </label>
                                <input
                                    id="title"
                                    name="title"
                                    type="text"
                                    value={formData.title}
                                    onChange={handleChange}
                                    required
                                    className="block w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                    placeholder="e.g. Modern Apartment in Downtown"
                                />
                            </div>

                            <div className="md:col-span-2">
                                <label className="block mb-2 text-sm font-medium text-gray-700" htmlFor="description">
                                    Description *
                                </label>
                                <textarea
                                    id="description"
                                    name="description"
                                    rows="5"
                                    value={formData.description}
                                    onChange={handleChange}
                                    required
                                    className="block w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                    placeholder="Describe your property in detail..."
                                />
                            </div>

                            <div>
                                <label className="block mb-2 text-sm font-medium text-gray-700" htmlFor="price">
                                    Price ($) *
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                                        <FiDollarSign className="text-gray-500" />
                                    </div>
                                    <input
                                        id="price"
                                        name="price"
                                        type="number"
                                        min="0"
                                        step="1000"
                                        value={formData.price}
                                        onChange={handleChange}
                                        required
                                        className="block w-full p-3 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                        placeholder="450000"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block mb-2 text-sm font-medium text-gray-700" htmlFor="propertyType">
                                    Property Type *
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                                        <FiHome className="text-gray-500" />
                                    </div>
                                    <select
                                        id="propertyType"
                                        name="propertyType"
                                        value={formData.propertyType}
                                        onChange={handleChange}
                                        required
                                        className="block w-full p-3 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                    >
                                        <option value="">Select Type</option>
                                        {propertyTypes.map(type => (
                                            <option key={type} value={type}>{type}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block mb-2 text-sm font-medium text-gray-700" htmlFor="listingStatus">
                                    Listing Status *
                                </label>
                                <select
                                    id="listingStatus"
                                    name="listingStatus"
                                    value={formData.listingStatus}
                                    onChange={handleChange}
                                    required
                                    className="block w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                >
                                    <option value="">Select Type</option>
                                    {listingStatus.map(type => (
                                        <option key={type} value={type}>{type}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Location */}
                    <div className="p-6 bg-white shadow-sm rounded-xl">
                        <h3 className="mb-4 text-lg font-bold text-gray-800">Location</h3>

                        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                            <div>
                                <label className="block mb-2 text-sm font-medium text-gray-700" htmlFor="city">
                                    City *
                                </label>
                                <input
                                    id="city"
                                    name="city"
                                    type="text"
                                    value={formData.city}
                                    onChange={handleChange}
                                    required
                                    className="block w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                    placeholder="e.g. Nairobi"
                                />
                            </div>

                            <div>
                                <label className="block mb-2 text-sm font-medium text-gray-700" htmlFor="area">
                                    Area *
                                </label>
                                <input
                                    id="area"
                                    name="area"
                                    type="text"
                                    value={formData.area}
                                    onChange={handleChange}
                                    required
                                    className="block w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                    placeholder="e.g. Westlands"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Property Details */}
                    <div className="p-6 bg-white shadow-sm rounded-xl">
                        <h3 className="mb-4 text-lg font-bold text-gray-800">Property Details</h3>

                        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                            <div>
                                <label className="block mb-2 text-sm font-medium text-gray-700" htmlFor="beds">
                                    Bedrooms *
                                </label>
                                <input
                                    id="beds"
                                    name="beds"
                                    type="number"
                                    min="0"
                                    value={formData.beds}
                                    onChange={handleChange}
                                    required
                                    className="block w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                />
                            </div>

                            <div>
                                <label className="block mb-2 text-sm font-medium text-gray-700" htmlFor="baths">
                                    Bathrooms *
                                </label>
                                <input
                                    id="baths"
                                    name="baths"
                                    type="number"
                                    min="0"
                                    step="0.5"
                                    value={formData.baths}
                                    onChange={handleChange}
                                    required
                                    className="block w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                />
                            </div>

                            <div>
                                <label className="block mb-2 text-sm font-medium text-gray-700" htmlFor="yearBuilt">
                                    Year Built
                                </label>
                                <input
                                    id="yearBuilt"
                                    name="yearBuilt"
                                    type="number"
                                    min="1800"
                                    max={new Date().getFullYear()}
                                    value={formData.yearBuilt}
                                    onChange={handleChange}
                                    className="block w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                />
                            </div>

                            <div>
                                <label className="block mb-2 text-sm font-medium text-gray-700" htmlFor="stories">
                                    Stories
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                                        <FiLayers className="text-gray-500" />
                                    </div>
                                    <select
                                        id="stories"
                                        name="stories"
                                        value={formData.stories}
                                        onChange={handleChange}
                                        className="block w-full p-3 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                    >
                                        <option value="1">1</option>
                                        <option value="2">2</option>
                                        <option value="3">3</option>
                                        <option value="4+">4+</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block mb-2 text-sm font-medium text-gray-700" htmlFor="garage">
                                    Garage Spaces
                                </label>
                                <select
                                    id="garage"
                                    name="garage"
                                    value={formData.garage}
                                    onChange={handleChange}
                                    className="block w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                >
                                    <option value="0">None</option>
                                    <option value="1">1</option>
                                    <option value="2">2</option>
                                    <option value="3">3</option>
                                    <option value="4+">4+</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Features */}
                    <div className="p-6 bg-white shadow-sm rounded-xl">
                        <h3 className="mb-4 text-lg font-bold text-gray-800">Features</h3>
                        <p className="mb-4 text-gray-600">Select all the features that apply to this property.</p>

                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
                            {possibleFeatures.map(feature => (
                                <div key={feature} className="flex items-center">
                                    <input
                                        type="checkbox"
                                        id={`feature-${feature}`}
                                        checked={formData.features.includes(feature)}
                                        onChange={() => handleFeatureToggle(feature)}
                                        className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
                                    />
                                    <label htmlFor={`feature-${feature}`} className="ml-2 text-gray-700">
                                        {feature}
                                    </label>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Images */}
                    <div className="p-6 bg-white shadow-sm rounded-xl">
                        <h3 className="mb-4 text-lg font-bold text-gray-800">Property Images</h3>
                        <p className="mb-4 text-gray-600">Upload high-quality images of your property. You can upload multiple images.</p>

                        <div className="mb-6">
                            <label
                                htmlFor="images"
                                className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100"
                            >
                                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                    <FiImage className="w-10 h-10 mb-3 text-gray-400" />
                                    <p className="mb-2 text-sm text-gray-500"><span className="font-semibold">Click to upload</span> or drag and drop</p>
                                    <p className="text-xs text-gray-500">PNG, JPG or WEBP (Max: 10MB per image)</p>
                                </div>
                                <input
                                    id="images"
                                    name="images"
                                    type="file"
                                    accept="image/*"
                                    multiple
                                    className="hidden"
                                    onChange={handleImageChange}
                                />
                            </label>
                        </div>

                        {imagePreviews.length > 0 && (
                            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
                                {imagePreviews.map((preview, index) => (
                                    <div key={index} className="relative group">
                                        <img
                                            src={preview}
                                            alt={`Preview ${index + 1}`}
                                            className="object-cover w-full h-32 rounded-lg"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => removeImage(index)}
                                            className="absolute p-1 text-white transition-opacity bg-red-500 rounded-full opacity-0 top-2 right-2 group-hover:opacity-100"
                                        >
                                            <FiXCircle size={16} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Submit */}
                    <div className="flex justify-end">
                        {isSubmitting ? (
                            <div className="w-full">
                                <div className="h-2 mb-2 bg-gray-200 rounded-full">
                                    <div
                                        className="h-2 rounded-full bg-emerald-500"
                                        style={{ width: `${uploadProgress}%` }}
                                    ></div>
                                </div>
                                <div className="text-center text-gray-600">
                                    Uploading... {uploadProgress}%
                                </div>
                            </div>
                        ) : (
                            <button
                                type="submit"
                                className="px-8 py-3 text-white rounded-lg bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
                            >
                                Submit Property
                            </button>
                        )}
                    </div>
                </form>
            </div>
        </DashboardLayout>
    );
};

export default ListProperty;