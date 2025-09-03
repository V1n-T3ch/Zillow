import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiImage, FiDollarSign, FiHome, FiMap, FiMapPin, FiCheckSquare, FiMaximize, FiLayers, FiPlus, FiXCircle } from 'react-icons/fi';
import DashboardLayout from '../../../components/dashboard/DashboardLayout';
import { useAuth } from '../../../hooks/useAuth';
import { db } from '../../../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import axios from 'axios'; // Add this import

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
        address: '',
        city: '',
        state: '',
        zip: '',
        propertyType: '',
        status: 'For Sale',
        beds: '',
        baths: '',
        sqft: '',
        lotSize: '',
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

    const possibleFeatures = [
        'Air Conditioning', 'Balcony', 'Dishwasher', 'Fireplace', 'Garden',
        'Gym', 'Hardwood Floors', 'Parking', 'Pool', 'Security System',
        'Waterfront', 'Pet Friendly', 'Smart Home', 'Storage', 'Walk-in Closet',
        'Furnished', 'Basement', 'Solar Panels', 'Elevator', 'Ocean View'
    ];

    const handleChange = (e) => {
        const { name, value } = e.target;

        // Handle number inputs
        if (['price', 'beds', 'baths', 'sqft', 'yearBuilt'].includes(name)) {
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
                <h2 className="text-2xl font-bold text-gray-800 mb-6">List a New Property</h2>

                {submitError && (
                    <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-lg">
                        {submitError}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-8">
                    {/* Basic Information */}
                    <div className="bg-white p-6 rounded-xl shadow-sm">
                        <h3 className="text-lg font-bold text-gray-800 mb-4">Basic Information</h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="md:col-span-2">
                                <label className="block text-gray-700 text-sm font-medium mb-2" htmlFor="title">
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
                                <label className="block text-gray-700 text-sm font-medium mb-2" htmlFor="description">
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
                                <label className="block text-gray-700 text-sm font-medium mb-2" htmlFor="price">
                                    Price ($) *
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
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
                                        className="block w-full pl-10 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                        placeholder="450000"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-gray-700 text-sm font-medium mb-2" htmlFor="propertyType">
                                    Property Type *
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <FiHome className="text-gray-500" />
                                    </div>
                                    <select
                                        id="propertyType"
                                        name="propertyType"
                                        value={formData.propertyType}
                                        onChange={handleChange}
                                        required
                                        className="block w-full pl-10 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                    >
                                        <option value="">Select Type</option>
                                        {propertyTypes.map(type => (
                                            <option key={type} value={type}>{type}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-gray-700 text-sm font-medium mb-2" htmlFor="status">
                                    Listing Status *
                                </label>
                                <select
                                    id="status"
                                    name="status"
                                    value={formData.status}
                                    onChange={handleChange}
                                    required
                                    className="block w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                >
                                    <option value="For Sale">For Sale</option>
                                    <option value="For Rent">For Rent</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Location */}
                    <div className="bg-white p-6 rounded-xl shadow-sm">
                        <h3 className="text-lg font-bold text-gray-800 mb-4">Location</h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="md:col-span-2">
                                <label className="block text-gray-700 text-sm font-medium mb-2" htmlFor="address">
                                    Street Address *
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <FiMapPin className="text-gray-500" />
                                    </div>
                                    <input
                                        id="address"
                                        name="address"
                                        type="text"
                                        value={formData.address}
                                        onChange={handleChange}
                                        required
                                        className="block w-full pl-10 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                        placeholder="123 Main St"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-gray-700 text-sm font-medium mb-2" htmlFor="city">
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
                                <label className="block text-gray-700 text-sm font-medium mb-2" htmlFor="state">
                                    State/Province *
                                </label>
                                <input
                                    id="state"
                                    name="state"
                                    type="text"
                                    value={formData.state}
                                    onChange={handleChange}
                                    required
                                    className="block w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                    placeholder="e.g. Nairobi"
                                />
                            </div>

                            <div>
                                <label className="block text-gray-700 text-sm font-medium mb-2" htmlFor="zip">
                                    ZIP/Postal Code *
                                </label>
                                <input
                                    id="zip"
                                    name="zip"
                                    type="text"
                                    value={formData.zip}
                                    onChange={handleChange}
                                    required
                                    className="block w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                    placeholder="e.g. 00100"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Property Details */}
                    <div className="bg-white p-6 rounded-xl shadow-sm">
                        <h3 className="text-lg font-bold text-gray-800 mb-4">Property Details</h3>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div>
                                <label className="block text-gray-700 text-sm font-medium mb-2" htmlFor="beds">
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
                                <label className="block text-gray-700 text-sm font-medium mb-2" htmlFor="baths">
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
                                <label className="block text-gray-700 text-sm font-medium mb-2" htmlFor="sqft">
                                    Square Feet *
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <FiMaximize className="text-gray-500" />
                                    </div>
                                    <input
                                        id="sqft"
                                        name="sqft"
                                        type="number"
                                        min="0"
                                        value={formData.sqft}
                                        onChange={handleChange}
                                        required
                                        className="block w-full pl-10 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-gray-700 text-sm font-medium mb-2" htmlFor="lotSize">
                                    Lot Size
                                </label>
                                <input
                                    id="lotSize"
                                    name="lotSize"
                                    type="text"
                                    value={formData.lotSize}
                                    onChange={handleChange}
                                    className="block w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                    placeholder="e.g. 0.25 acres"
                                />
                            </div>

                            <div>
                                <label className="block text-gray-700 text-sm font-medium mb-2" htmlFor="yearBuilt">
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
                                <label className="block text-gray-700 text-sm font-medium mb-2" htmlFor="stories">
                                    Stories
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <FiLayers className="text-gray-500" />
                                    </div>
                                    <select
                                        id="stories"
                                        name="stories"
                                        value={formData.stories}
                                        onChange={handleChange}
                                        className="block w-full pl-10 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                    >
                                        <option value="1">1</option>
                                        <option value="2">2</option>
                                        <option value="3">3</option>
                                        <option value="4+">4+</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-gray-700 text-sm font-medium mb-2" htmlFor="garage">
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
                    <div className="bg-white p-6 rounded-xl shadow-sm">
                        <h3 className="text-lg font-bold text-gray-800 mb-4">Features</h3>
                        <p className="text-gray-600 mb-4">Select all the features that apply to this property.</p>

                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                            {possibleFeatures.map(feature => (
                                <div key={feature} className="flex items-center">
                                    <input
                                        type="checkbox"
                                        id={`feature-${feature}`}
                                        checked={formData.features.includes(feature)}
                                        onChange={() => handleFeatureToggle(feature)}
                                        className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
                                    />
                                    <label htmlFor={`feature-${feature}`} className="ml-2 text-gray-700">
                                        {feature}
                                    </label>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Images */}
                    <div className="bg-white p-6 rounded-xl shadow-sm">
                        <h3 className="text-lg font-bold text-gray-800 mb-4">Property Images</h3>
                        <p className="text-gray-600 mb-4">Upload high-quality images of your property. You can upload multiple images.</p>

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
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                                {imagePreviews.map((preview, index) => (
                                    <div key={index} className="relative group">
                                        <img
                                            src={preview}
                                            alt={`Preview ${index + 1}`}
                                            className="h-32 w-full object-cover rounded-lg"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => removeImage(index)}
                                            className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
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
                                <div className="bg-gray-200 h-2 rounded-full mb-2">
                                    <div
                                        className="bg-emerald-500 h-2 rounded-full"
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
                                className="px-8 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
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