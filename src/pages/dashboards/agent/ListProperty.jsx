import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiImage, FiVideo, FiHome, FiLayers, FiXCircle, FiMapPin, FiPlay } from 'react-icons/fi';
import DashboardLayout from '../../../components/dashboard/DashboardLayout';
import { useAuth } from '../../../hooks/useAuth';
import { db } from '../../../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import axios from 'axios';
import LocationPicker from '../../../components/maps/LocationPicker';

const ListProperty = () => {
    const { currentUser } = useAuth();
    const navigate = useNavigate();

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState('');
    const [uploadProgress, setUploadProgress] = useState(0);
    
    // Get API URL with fallback
    const getApiUrl = () => {
        const envUrl = import.meta.env.VITE_APP_B2_API_URL;
        if (!envUrl) {
            console.warn('VITE_APP_B2_API_URL not found in environment variables');
            return 'http://localhost:5000'; // fallback for development
        }
        return envUrl;
    };

    const [formData, setFormData] = useState({
        title: '',
        description: '',
        price: '',
        city: '',
        area: '',
        propertyType: '',
        beds: '',
        baths: '',
        stories: '1',
        garage: '0',
        features: [],
        images: [],
        videos: [] // Add videos array
    });

    const [mediaFiles, setMediaFiles] = useState([]); // Combined images and videos
    const [mediaPreviews, setMediaPreviews] = useState([]);

    // Location picker state
    const [selectedLocation, setSelectedLocation] = useState(null);
    const [address, setAddress] = useState('');
    const [city, setCity] = useState('');
    const [state, setState] = useState('');

    const handleLocationSelect = (location) => {
        if (!location) return;

        setSelectedLocation({
            lat: location.lat,
            lng: location.lng
        });

        setAddress(location.address || '');
        setCity(location.city || '');
        setState(location.state || '');

        setFormData(prev => ({
            ...prev,
            city: location.city || prev.city,
            area: location.address || prev.area
        }));
    };

    const propertyTypes = [
        'Studio','Bedsitter', 'Apartment', 'Bungalow', 'Mansionette', 'Villa', 'Commercial', 'BnB', 'Singles'
    ];

    const kenyaCounties = [
        'Baringo', 'Bomet', 'Bungoma', 'Busia', 'Elgeyo-Marakwet', 'Embu',
        'Garissa', 'Homa Bay', 'Isiolo', 'Kajiado', 'Kakamega', 'Kericho',
        'Kiambu', 'Kilifi', 'Kirinyaga', 'Kisii', 'Kisumu', 'Kitui', 'Kwale',
        'Laikipia', 'Lamu', 'Machakos', 'Makueni', 'Mandera', 'Marsabit',
        'Meru', 'Migori', 'Mombasa', 'Murang\'a', 'Nairobi', 'Nakuru',
        'Nandi', 'Narok', 'Nyamira', 'Nyandarua', 'Nyeri', 'Samburu',
        'Siaya', 'Taita-Taveta', 'Tana River', 'Tharaka-Nithi', 'Trans Nzoia',
        'Turkana', 'Uasin Gishu', 'Vihiga', 'Wajir', 'West Pokot'
    ];
    
    const possibleFeatures = [
        'Air Conditioning', 'Balcony', 'Dishwasher', 'Fireplace', 'Garden',
        'Gym', 'Hardwood Floors', 'Parking', 'Pool', 'Security System',
        'Waterfront', 'Pet Friendly', 'Smart Home', 'Storage', 'Walk-in Closet',
        'Furnished', 'Basement', 'Solar Panels', 'Elevator', 'Ocean View'
    ];

    const handleChange = (e) => {
        const { name, value } = e.target;

        if (['price', 'beds', 'baths'].includes(name)) {
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

    // Helper function to check if file is video
    const isVideoFile = (file) => {
        return file.type.startsWith('video/');
    };

    // Helper function to check if file is image
    const isImageFile = (file) => {
        return file.type.startsWith('image/');
    };

    // Helper function to get file size in MB
    const getFileSizeInMB = (file) => {
        return (file.size / (1024 * 1024)).toFixed(2);
    };

    const handleMediaChange = (e) => {
        const files = Array.from(e.target.files);
        
        const validFiles = [];
        const errors = [];

        files.forEach(file => {
            const isImage = isImageFile(file);
            const isVideo = isVideoFile(file);
            const sizeInMB = parseFloat(getFileSizeInMB(file));

            if (!isImage && !isVideo) {
                errors.push(`${file.name}: Only images and videos are allowed`);
                return;
            }

            if (isImage && sizeInMB > 10) {
                errors.push(`${file.name}: Image size must be less than 10MB`);
                return;
            }

            if (isVideo) {
                // Check video format
                const allowedVideoTypes = ['video/mp4', 'video/mov', 'video/avi', 'video/quicktime'];
                if (!allowedVideoTypes.includes(file.type)) {
                    errors.push(`${file.name}: Only MP4, MOV, and AVI video formats are supported`);
                    return;
                }
                
                if (sizeInMB > 100) {
                    errors.push(`${file.name}: Video size must be less than 100MB`);
                    return;
                }
            }

            validFiles.push(file);
        });

        if (errors.length > 0) {
            setSubmitError(errors.join(', '));
            return;
        }

        // Create previews for valid files
        const newPreviews = validFiles.map(file => {
            if (isImageFile(file)) {
                return {
                    type: 'image',
                    url: URL.createObjectURL(file),
                    file: file,
                    name: file.name,
                    size: getFileSizeInMB(file)
                };
            } else {
                return {
                    type: 'video',
                    url: URL.createObjectURL(file),
                    file: file,
                    name: file.name,
                    size: getFileSizeInMB(file)
                };
            }
        });

        setMediaPreviews([...mediaPreviews, ...newPreviews]);
        setMediaFiles([...mediaFiles, ...validFiles]);
        setSubmitError(''); // Clear any previous errors
    };

    const removeMedia = (index) => {
        const newPreviews = [...mediaPreviews];
        const newFiles = [...mediaFiles];

        URL.revokeObjectURL(newPreviews[index].url);
        newPreviews.splice(index, 1);
        newFiles.splice(index, 1);

        setMediaPreviews(newPreviews);
        setMediaFiles(newFiles);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (mediaFiles.length === 0) {
            setSubmitError('Please upload at least one image or video');
            return;
        }

        if (!selectedLocation) {
            setSubmitError('Please select a location on the map');
            return;
        }

        setIsSubmitting(true);
        setSubmitError('');

        try {
            const apiUrl = getApiUrl();
            
            const imageUrls = [];
            const videoUrls = [];
            
            // Upload all media files to B2 via backend
            for (let i = 0; i < mediaFiles.length; i++) {
                const file = mediaFiles[i];
                const uploadFormData = new FormData();
                uploadFormData.append('image', file);

                const uploadUrl = `${apiUrl}/api/images/upload`;
                console.log(`Uploading file ${i + 1}/${mediaFiles.length}:`, {
                    name: file.name,
                    size: `${(file.size / (1024 * 1024)).toFixed(2)}MB`,
                    type: file.type
                });

                try {
                    const res = await axios.post(uploadUrl, uploadFormData, {
                        headers: {
                            'Content-Type': 'multipart/form-data'
                        },
                        timeout: 300000, // 5 minute timeout for large videos
                        onUploadProgress: (progressEvent) => {
                            const fileProgress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                            const overallProgress = Math.round(((i / mediaFiles.length) * 100) + (fileProgress / mediaFiles.length));
                            setUploadProgress(overallProgress);
                            console.log(`Upload progress for ${file.name}: ${fileProgress}%`);
                        }
                    });

                    console.log(`Upload response for ${file.name}:`, res.data);

                    if (res.data.status === 'success' && res.data.data?.fileUrl) {
                        if (isImageFile(file)) {
                            imageUrls.push(res.data.data.fileUrl);
                        } else {
                            videoUrls.push(res.data.data.fileUrl);
                        }
                    } else {
                        throw new Error(`Upload failed for ${file.name}: ${res.data.message || 'Unknown error'}`);
                    }
                } catch (uploadError) {
                    console.error(`Failed to upload ${file.name}:`, uploadError);
                    throw new Error(`Failed to upload ${file.name}: ${uploadError.message}`);
                }
            }

            console.log('All uploads completed:', { imageUrls, videoUrls });

            // Create property document in Firestore
            const propertyData = {
                ...formData,
                images: imageUrls,
                videos: videoUrls,
                location: selectedLocation,
                agentId: currentUser.uid,
                agentName: currentUser.displayName || 'Anonymous',
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
                views: 0,
                favorites: 0,
                status: 'active'
            };

            console.log('Creating property with data:', propertyData);
            const docRef = await addDoc(collection(db, 'properties'), propertyData);

            navigate(`/agent/properties?success=true&propertyId=${docRef.id}`);

        } catch (error) {
            console.error('Error adding property:', error);
            
            if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
                setSubmitError('Upload timeout. Please try again with smaller video files or check your internet connection.');
            } else if (error.response?.status === 413) {
                setSubmitError('File too large. Please reduce video file sizes and try again.');
            } else if (error.response) {
                setSubmitError(`Server error: ${error.response.data?.message || error.response.statusText}`);
            } else {
                setSubmitError(`Failed to add property: ${error.message}`);
            }
        } finally {
            setIsSubmitting(false);
            setUploadProgress(0);
        }
    };

    return (
        <DashboardLayout role="agent">
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
                                <label className="block mb-2 text-sm font-medium text-gray-700" htmlFor="price">
                                    Price (Ksh.) *
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-500">
                                        Ksh.
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
                        </div>
                    </div>

                    {/* Location */}
                    <div className="p-6 bg-white shadow-sm rounded-xl">
                        <h3 className="mb-4 text-lg font-bold text-gray-800">Location</h3>

                        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                            <div>
                                <label className="block mb-2 text-sm font-medium text-gray-700" htmlFor="city">
                                    County *
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                                        <FiMapPin className="text-gray-500" />
                                    </div>
                                    <select
                                        id="city"
                                        name="city"
                                        value={formData.city}
                                        onChange={handleChange}
                                        required
                                        className="block w-full p-3 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                    >
                                        <option value="">Select County</option>
                                        {kenyaCounties.map(county => (
                                            <option key={county} value={county}>{county}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block mb-2 text-sm font-medium text-gray-700" htmlFor="area">
                                    Area/Neighborhood *
                                </label>
                                <input
                                    id="area"
                                    name="area"
                                    type="text"
                                    value={formData.area}
                                    onChange={handleChange}
                                    required
                                    className="block w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                    placeholder="e.g. Westlands, Karen, Kilimani"
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

                    {/* Media Upload */}
                    <div className="p-6 bg-white shadow-sm rounded-xl">
                        <h3 className="mb-4 text-lg font-bold text-gray-800">Property Media</h3>
                        <p className="mb-4 text-gray-600">
                            Upload high-quality images and videos of your property. Images: max 10MB each. Videos: max 100MB each.
                        </p>

                        <div className="mb-6">
                            <label
                                htmlFor="media"
                                className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100"
                            >
                                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                    <div className="flex items-center mb-3 space-x-2">
                                        <FiImage className="w-8 h-8 text-gray-400" />
                                        <FiVideo className="w-8 h-8 text-gray-400" />
                                    </div>
                                    <p className="mb-2 text-sm text-gray-500">
                                        <span className="font-semibold">Click to upload</span> images and videos
                                    </p>
                                    <p className="text-xs text-gray-500">
                                        Images: PNG, JPG, WEBP (Max: 10MB) | Videos: MP4, MOV, AVI (Max: 100MB)
                                    </p>
                                </div>
                                <input
                                    id="media"
                                    name="media"
                                    type="file"
                                    accept="image/*,video/*"
                                    multiple
                                    className="hidden"
                                    onChange={handleMediaChange}
                                />
                            </label>
                        </div>

                        {mediaPreviews.length > 0 && (
                            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
                                {mediaPreviews.map((preview, index) => (
                                    <div key={index} className="relative group">
                                        {preview.type === 'image' ? (
                                            <img
                                                src={preview.url}
                                                alt={`Preview ${index + 1}`}
                                                className="object-cover w-full h-32 rounded-lg"
                                            />
                                        ) : (
                                            <div className="relative w-full h-32 overflow-hidden bg-gray-200 rounded-lg">
                                                <video
                                                    src={preview.url}
                                                    className="object-cover w-full h-full"
                                                    muted
                                                />
                                                <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30">
                                                    <FiPlay className="w-8 h-8 text-white" />
                                                </div>
                                            </div>
                                        )}
                                        
                                        {/* File info overlay */}
                                        <div className="absolute bottom-0 left-0 right-0 p-2 text-xs text-white transition-opacity bg-black rounded-b-lg opacity-0 bg-opacity-70 group-hover:opacity-100">
                                            <div className="truncate">{preview.name}</div>
                                            <div>{preview.size}MB</div>
                                        </div>
                                        
                                        {/* Remove button */}
                                        <button
                                            type="button"
                                            onClick={() => removeMedia(index)}
                                            className="absolute p-1 text-white transition-opacity bg-red-500 rounded-full opacity-0 top-2 right-2 group-hover:opacity-100"
                                        >
                                            <FiXCircle size={16} />
                                        </button>
                                        
                                        {/* Media type indicator */}
                                        <div className="absolute px-2 py-1 text-xs text-white bg-black rounded top-2 left-2 bg-opacity-70">
                                            {preview.type === 'image' ? (
                                                <FiImage size={12} />
                                            ) : (
                                                <FiVideo size={12} />
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Map */}
                    <div className="p-6 bg-white shadow-sm rounded-xl">
                        <h3 className="mb-4 text-lg font-bold text-gray-800">Property Location</h3>
                        <LocationPicker
                            onLocationSelect={handleLocationSelect}
                            initialLocation={selectedLocation}
                            address={address}
                            city={city}
                            state={state}
                        />
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