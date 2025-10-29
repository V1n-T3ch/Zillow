import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { FiSave, FiAlertCircle, FiX, FiUpload, FiHome, FiImage, FiVideo, FiPlay } from 'react-icons/fi';
import DashboardLayout from '../../../components/dashboard/DashboardLayout';
import { useAuth } from '../../../hooks/useAuth';
import { db } from '../../../firebase';
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { toast } from 'react-toastify';
import axios from 'axios';

const EditProperty = () => {
    const { id } = useParams();
    const { currentUser } = useAuth();
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState(null);
    const [property, setProperty] = useState(null);
    const [mediaFiles, setMediaFiles] = useState([]); // Combined images and videos
    const [existingImages, setExistingImages] = useState([]);
    const [existingVideos, setExistingVideos] = useState([]);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [deletedImages, setDeletedImages] = useState([]); // Track deleted images
    const [deletedVideos, setDeletedVideos] = useState([]); // Track deleted videos
    
    const { register, handleSubmit, formState: { errors }, reset, watch } = useForm();
    
    // Features options
    const featuresOptions = [
        'Balcony', 'Air Conditioning', 'Gym', 'Swimming Pool', 'Security System',
        'Hardwood Floors', 'Furnished', 'Parking', 'Garden', 'Elevator',
        'Fireplace', 'Washing Machine', 'Dishwasher', 'Pet Friendly', 'Storage'
    ];
    
    // Property type options
    const propertyTypes = [
        'Studio','Bedsitter', 'Apartment', 'Bungalow', 'Mansionette', 'Villa', 'Commercial', 'BnB', 'Singles'
    ];
    
    // Get form values for dynamic preview
    const watchTitle = watch('title', '');
    const watchPrice = watch('price', '');
    const watchArea = watch('area', '');
    const watchCity = watch('city', '');
    const watchFeatures = watch('features', []);

    // Helper functions
    const isVideoFile = (file) => file.type.startsWith('video/');
    const isImageFile = (file) => file.type.startsWith('image/');
    const getFileSizeInMB = (file) => (file.size / (1024 * 1024)).toFixed(2);
    
    // Get API URL helper
    const getApiUrl = () => {
        return import.meta.env.VITE_APP_B2_API_URL || 'http://localhost:5000';
    };
    
    // Fetch property data on component mount
    useEffect(() => {
        const fetchProperty = async () => {
            if (!currentUser) return;
            
            try {
                setIsLoading(true);
                const propertyRef = doc(db, 'properties', id);
                const propertyDoc = await getDoc(propertyRef);
                
                if (!propertyDoc.exists()) {
                    setError('Property not found');
                    setIsLoading(false);
                    return;
                }
                
                const propertyData = propertyDoc.data();
                
                // Check if the current user is the owner - Fixed field name
                if (propertyData.agentId !== currentUser.uid) {
                    setError('You do not have permission to edit this property');
                    setIsLoading(false);
                    return;
                }
                
                setProperty(propertyData);
                setExistingImages(propertyData.images || []);
                setExistingVideos(propertyData.videos || []);
                
                // Reset form with property data
                reset({
                    title: propertyData.title || '',
                    price: propertyData.price || '',
                    area: propertyData.area || '',
                    city: propertyData.city || '',
                    state: propertyData.state || '',
                    zip: propertyData.zip || '',
                    description: propertyData.description || '',
                    propertyType: propertyData.propertyType || 'Bedsitter',
                    beds: propertyData.beds || '',
                    baths: propertyData.baths || '',
                    sqft: propertyData.sqft || '',
                    lotSize: propertyData.lotSize || '',
                    yearBuilt: propertyData.yearBuilt || '',
                    stories: propertyData.stories || '',
                    garage: propertyData.garage || '',
                    features: propertyData.features || []
                });
                
            } catch (error) {
                console.error('Error fetching property:', error);
                setError('Failed to load property data. Please try again.');
            } finally {
                setIsLoading(false);
            }
        };
        
        fetchProperty();
    }, [id, currentUser, reset]);
    
    // Clean up object URLs when component unmounts or when mediaFiles change
    useEffect(() => {
        return () => {
            // Revoke object URLs to avoid memory leaks
            mediaFiles.forEach(file => {
                if (file.preview) {
                    URL.revokeObjectURL(file.preview);
                }
            });
        };
    }, [mediaFiles]);
    
    // Handle media upload (images and videos)
    const handleMediaChange = (e) => {
        const files = Array.from(e.target.files);
        
        // Validate files
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

            // Add preview URL and metadata
            file.preview = URL.createObjectURL(file);
            file.isVideo = isVideo;
            file.isImage = isImage;
            file.sizeInMB = sizeInMB;
            
            validFiles.push(file);
        });

        if (errors.length > 0) {
            toast.error(errors.join(', '));
            return;
        }
        
        setMediaFiles(prev => [...prev, ...validFiles]);
    };
    
    // Remove media file from upload queue
    const removeMediaFile = (index) => {
        setMediaFiles(prev => {
            const newFiles = [...prev];
            // Revoke the URL of the removed file
            if (newFiles[index].preview) {
                URL.revokeObjectURL(newFiles[index].preview);
            }
            newFiles.splice(index, 1);
            return newFiles;
        });
    };
    
    // Remove existing image
    const removeExistingImage = (index) => {
        const imageToDelete = existingImages[index];
        setDeletedImages(prev => [...prev, imageToDelete]);
        setExistingImages(prev => prev.filter((_, i) => i !== index));
    };

    // Remove existing video
    const removeExistingVideo = (index) => {
        const videoToDelete = existingVideos[index];
        setDeletedVideos(prev => [...prev, videoToDelete]);
        setExistingVideos(prev => prev.filter((_, i) => i !== index));
    };
    
    // Submit form handler
    const onSubmit = async (data) => {
        setIsSubmitting(true);
        setError(null);
        
        try {
            // Upload new media if any
            const newImageUrls = [];
            const newVideoUrls = [];
            
            if (mediaFiles.length > 0) {
                const apiUrl = getApiUrl();
                
                for (let i = 0; i < mediaFiles.length; i++) {
                    const file = mediaFiles[i];
                    const formData = new FormData();
                    formData.append('image', file); // Backend expects 'image' field for both
                    
                    const uploadUrl = `${apiUrl}/api/images/upload`;
                    console.log(`Uploading file ${i + 1}/${mediaFiles.length}:`, {
                        name: file.name,
                        size: `${file.sizeInMB}MB`,
                        type: file.type
                    });
                    
                    try {
                        const res = await axios.post(uploadUrl, formData, {
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
                            if (file.isImage) {
                                newImageUrls.push(res.data.data.fileUrl);
                            } else if (file.isVideo) {
                                newVideoUrls.push(res.data.data.fileUrl);
                            }
                        } else {
                            throw new Error(`Upload failed for ${file.name}: ${res.data.message || 'Unknown error'}`);
                        }
                    } catch (uploadError) {
                        console.error(`Failed to upload ${file.name}:`, uploadError);
                        throw new Error(`Failed to upload ${file.name}: ${uploadError.message}`);
                    }
                }
            }
            
            // Combine existing and new media (excluding deleted ones)
            const finalImages = [...existingImages, ...newImageUrls];
            const finalVideos = [...existingVideos, ...newVideoUrls];
            
            console.log('Final media counts:', {
                images: finalImages.length,
                videos: finalVideos.length,
                deletedImages: deletedImages.length,
                deletedVideos: deletedVideos.length
            });
            
            // Update property in Firestore
            const propertyRef = doc(db, 'properties', id);
            
            const updateData = {
                title: data.title,
                price: Number(data.price),
                area: data.area,
                city: data.city,
                state: data.state,
                description: data.description,
                propertyType: data.propertyType,
                beds: Number(data.beds) || 0,
                baths: Number(data.baths) || 0,
                yearBuilt: data.yearBuilt ? Number(data.yearBuilt) : null,
                stories: data.stories || null,
                garage: data.garage || null,
                features: data.features || [],
                images: finalImages,
                videos: finalVideos,
                updatedAt: serverTimestamp()
            };
            
            console.log('Updating property with data:', updateData);
            
            await updateDoc(propertyRef, updateData);
            
            toast.success('Property updated successfully!');
            
            // Clean up media files
            mediaFiles.forEach(file => {
                if (file.preview) {
                    URL.revokeObjectURL(file.preview);
                }
            });
            
            // Redirect to manage properties
            navigate('/agent/properties');
            
        } catch (error) {
            console.error('Error updating property:', error);
            
            if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
                setError('Upload timeout. Please try again with smaller video files or check your internet connection.');
            } else if (error.response?.status === 413) {
                setError('File too large. Please reduce video file sizes and try again.');
            } else if (error.response) {
                setError(`Server error: ${error.response.data?.message || error.response.statusText}`);
            } else {
                setError(`Failed to update property: ${error.message}`);
            }
            
            toast.error('Failed to update property');
        } finally {
            setIsSubmitting(false);
            setUploadProgress(0);
        }
    };
    
    if (isLoading) {
        return (
            <DashboardLayout role="agent">
                <div className="space-y-4 animate-pulse">
                    <div className="w-1/2 h-8 bg-gray-200 rounded"></div>
                    <div className="h-64 bg-gray-200 rounded"></div>
                    <div className="w-1/3 h-8 bg-gray-200 rounded"></div>
                    <div className="h-32 bg-gray-200 rounded"></div>
                </div>
            </DashboardLayout>
        );
    }
    
    if (error) {
        return (
            <DashboardLayout role="agent">
                <div className="flex items-start p-4 mb-6 text-red-700 rounded-lg bg-red-50">
                    <FiAlertCircle className="mt-0.5 mr-2" size={18} />
                    <div>{error}</div>
                </div>
                <button
                    onClick={() => navigate('/agent/properties')}
                    className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300"
                >
                    Back to Properties
                </button>
            </DashboardLayout>
        );
    }
    
    return (
        <DashboardLayout role="agent">
            <div>
                <div className="mb-6">
                    <h2 className="text-2xl font-bold text-gray-800">Edit Property</h2>
                    <p className="text-gray-600">Update your property listing information</p>
                </div>
                
                {/* Property Edit Form */}
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
                    
                    {/* Property Preview Card */}
                    <div className="p-4 bg-white rounded-lg shadow-subtle">
                        <h3 className="mb-3 text-lg font-bold text-gray-700">Property Preview</h3>
                        <div className="flex flex-col gap-4 md:flex-row">
                            <div className="flex items-center justify-center h-48 overflow-hidden bg-gray-100 rounded-lg md:w-1/3">
                                {existingImages.length > 0 ? (
                                    <img 
                                        src={existingImages[0]} 
                                        alt="Property preview" 
                                        className="object-cover w-full h-full"
                                        onError={(e) => {
                                            e.target.onerror = null;
                                            e.target.src = 'https://placehold.co/800x500?text=No+Image';
                                        }}
                                    />
                                ) : mediaFiles.find(f => f.isImage) ? (
                                    <img 
                                        src={mediaFiles.find(f => f.isImage).preview} 
                                        alt="Property preview" 
                                        className="object-cover w-full h-full" 
                                    />
                                ) : (
                                    <div className="p-4 text-center text-gray-400">
                                        <FiHome size={48} className="mx-auto mb-2" />
                                        <p>No images available</p>
                                    </div>
                                )}
                            </div>
                            <div className="md:w-2/3">
                                <h3 className="text-xl font-bold text-gray-800">{watchTitle || 'Property Title'}</h3>
                                <p className="mb-2 text-gray-600">{watchArea || 'Area'}, {watchCity || 'City'}</p>
                                <p className="text-xl font-semibold text-emerald-600">Ksh.{watchPrice ? Number(watchPrice).toLocaleString() : '0'}</p>
                                
                                <div className="flex flex-wrap gap-2 mt-3">
                                    {watchFeatures && watchFeatures.slice(0, 4).map((feature, index) => (
                                        <span key={index} className="px-2 py-1 text-xs rounded-full bg-emerald-50 text-emerald-700">
                                            {feature}
                                        </span>
                                    ))}
                                    {watchFeatures && watchFeatures.length > 4 && (
                                        <span className="px-2 py-1 text-xs text-gray-700 bg-gray-100 rounded-full">
                                            +{watchFeatures.length - 4} more
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    {/* Basic Information */}
                    <div className="p-6 bg-white rounded-lg shadow-subtle">
                        <h3 className="mb-4 text-lg font-bold text-gray-700">Basic Information</h3>
                        
                        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                            <div>
                                <label className="block mb-2 text-sm font-medium text-gray-700">
                                    Property Title*
                                </label>
                                <input
                                    type="text"
                                    className={`w-full p-3 border rounded-lg ${errors.title ? 'border-red-500' : 'border-gray-300'}`}
                                    placeholder="e.g. Modern 3 Bedroom Villa"
                                    {...register('title', { required: 'Title is required' })}
                                />
                                {errors.title && <p className="mt-1 text-xs text-red-500">{errors.title.message}</p>}
                            </div>
                            
                            <div>
                                <label className="block mb-2 text-sm font-medium text-gray-700">
                                    Price (Ksh)*
                                </label>
                                <input
                                    type="number"
                                    className={`w-full p-3 border rounded-lg ${errors.price ? 'border-red-500' : 'border-gray-300'}`}
                                    placeholder="e.g. 25000000"
                                    {...register('price', { 
                                        required: 'Price is required',
                                        min: { value: 1, message: 'Price must be greater than 0' }
                                    })}
                                />
                                {errors.price && <p className="mt-1 text-xs text-red-500">{errors.price.message}</p>}
                            </div>
                            
                            <div>
                                <label className="block mb-2 text-sm font-medium text-gray-700">
                                    Property Type*
                                </label>
                                <select
                                    className={`w-full p-3 border rounded-lg bg-white ${errors.propertyType ? 'border-red-500' : 'border-gray-300'}`}
                                    {...register('propertyType', { required: 'Property type is required' })}
                                >
                                    {propertyTypes.map(type => (
                                        <option key={type} value={type}>{type}</option>
                                    ))}
                                </select>
                                {errors.propertyType && <p className="mt-1 text-xs text-red-500">{errors.propertyType.message}</p>}
                            </div>
                            
                            <div className="md:col-span-2">
                                <label className="block mb-2 text-sm font-medium text-gray-700">
                                    Description*
                                </label>
                                <textarea
                                    rows="4"
                                    className={`w-full p-3 border rounded-lg ${errors.description ? 'border-red-500' : 'border-gray-300'}`}
                                    placeholder="Describe your property..."
                                    {...register('description', { required: 'Description is required' })}
                                ></textarea>
                                {errors.description && <p className="mt-1 text-xs text-red-500">{errors.description.message}</p>}
                            </div>
                        </div>
                    </div>
                    
                    {/* Location */}
                    <div className="p-6 bg-white rounded-lg shadow-subtle">
                        <h3 className="mb-4 text-lg font-bold text-gray-700">Location</h3>
                        
                        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                            <div className="md:col-span-2">
                                <label className="block mb-2 text-sm font-medium text-gray-700">
                                    Area*
                                </label>
                                <input
                                    type="text"
                                    className={`w-full p-3 border rounded-lg ${errors.area ? 'border-red-500' : 'border-gray-300'}`}
                                    placeholder="e.g. Westlands"
                                    {...register('area', { required: 'Area is required' })}
                                />
                                {errors.area && <p className="mt-1 text-xs text-red-500">{errors.area.message}</p>}
                            </div>
                            
                            <div>
                                <label className="block mb-2 text-sm font-medium text-gray-700">
                                    City*
                                </label>
                                <input
                                    type="text"
                                    className={`w-full p-3 border rounded-lg ${errors.city ? 'border-red-500' : 'border-gray-300'}`}
                                    placeholder="e.g. Nairobi"
                                    {...register('city', { required: 'City is required' })}
                                />
                                {errors.city && <p className="mt-1 text-xs text-red-500">{errors.city.message}</p>}
                            </div>
                            
                            <div>
                                <label className="block mb-2 text-sm font-medium text-gray-700">
                                    County*
                                </label>
                                <input
                                    type="text"
                                    className={`w-full p-3 border rounded-lg ${errors.state ? 'border-red-500' : 'border-gray-300'}`}
                                    placeholder="e.g. Nairobi County"
                                    {...register('state', { required: 'State/County is required' })}
                                />
                                {errors.state && <p className="mt-1 text-xs text-red-500">{errors.state.message}</p>}
                            </div>
                        </div>
                    </div>
                    
                    {/* Property Details */}
                    <div className="p-6 bg-white rounded-lg shadow-subtle">
                        <h3 className="mb-4 text-lg font-bold text-gray-700">Property Details</h3>
                        
                        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                            <div>
                                <label className="block mb-2 text-sm font-medium text-gray-700">
                                    Bedrooms*
                                </label>
                                <input
                                    type="number"
                                    className={`w-full p-3 border rounded-lg ${errors.beds ? 'border-red-500' : 'border-gray-300'}`}
                                    placeholder="e.g. 3"
                                    {...register('beds', { 
                                        required: 'Bedrooms is required',
                                        min: { value: 0, message: 'Cannot be negative' }
                                    })}
                                />
                                {errors.beds && <p className="mt-1 text-xs text-red-500">{errors.beds.message}</p>}
                            </div>
                            
                            <div>
                                <label className="block mb-2 text-sm font-medium text-gray-700">
                                    Bathrooms*
                                </label>
                                <input
                                    type="number"
                                    step="0.5"
                                    className={`w-full p-3 border rounded-lg ${errors.baths ? 'border-red-500' : 'border-gray-300'}`}
                                    placeholder="e.g. 2.5"
                                    {...register('baths', { 
                                        required: 'Bathrooms is required',
                                        min: { value: 0, message: 'Cannot be negative' }
                                    })}
                                />
                                {errors.baths && <p className="mt-1 text-xs text-red-500">{errors.baths.message}</p>}
                            </div>
                            
                            <div>
                                <label className="block mb-2 text-sm font-medium text-gray-700">
                                    Year Built
                                </label>
                                <input
                                    type="number"
                                    className="w-full p-3 border border-gray-300 rounded-lg"
                                    placeholder="e.g. 2020"
                                    {...register('yearBuilt')}
                                />
                            </div>
                            
                            <div>
                                <label className="block mb-2 text-sm font-medium text-gray-700">
                                    Stories
                                </label>
                                <input
                                    type="text"
                                    className="w-full p-3 border border-gray-300 rounded-lg"
                                    placeholder="e.g. 2"
                                    {...register('stories')}
                                />
                            </div>
                            
                            <div>
                                <label className="block mb-2 text-sm font-medium text-gray-700">
                                    Garage
                                </label>
                                <input
                                    type="text"
                                    className="w-full p-3 border border-gray-300 rounded-lg"
                                    placeholder="e.g. 2-car"
                                    {...register('garage')}
                                />
                            </div>
                        </div>
                    </div>
                    
                    {/* Features */}
                    <div className="p-6 bg-white rounded-lg shadow-subtle">
                        <h3 className="mb-4 text-lg font-bold text-gray-700">Features</h3>
                        
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3">
                            {featuresOptions.map(feature => (
                                <div key={feature} className="flex items-center">
                                    <input
                                        type="checkbox"
                                        id={`feature-${feature}`}
                                        value={feature}
                                        className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
                                        {...register('features')}
                                    />
                                    <label htmlFor={`feature-${feature}`} className="ml-2 text-gray-700">
                                        {feature}
                                    </label>
                                </div>
                            ))}
                        </div>
                    </div>
                    
                    {/* Media Section */}
                    <div className="p-6 bg-white rounded-lg shadow-subtle">
                        <h3 className="mb-4 text-lg font-bold text-gray-700">Property Media</h3>
                        
                        {/* Media Summary */}
                        <div className="p-3 mb-4 rounded-lg bg-gray-50">
                            <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                                <span>Current Images: {existingImages.length}</span>
                                <span>Current Videos: {existingVideos.length}</span>
                                <span>New Files to Upload: {mediaFiles.length}</span>
                                {deletedImages.length > 0 && <span className="text-red-600">Images to Delete: {deletedImages.length}</span>}
                                {deletedVideos.length > 0 && <span className="text-red-600">Videos to Delete: {deletedVideos.length}</span>}
                            </div>
                        </div>
                        
                        {/* Existing Media */}
                        {(existingImages.length > 0 || existingVideos.length > 0) && (
                            <div className="mb-6">
                                <h4 className="mb-2 font-medium text-gray-700">Current Media</h4>
                                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
                                    {/* Existing Images */}
                                    {existingImages.map((image, index) => (
                                        <div key={`img-${index}`} className="relative group">
                                            <div className="h-32 overflow-hidden rounded-lg">
                                                <img 
                                                    src={image} 
                                                    alt={`Property image ${index + 1}`} 
                                                    className="object-cover w-full h-full"
                                                    onError={(e) => {
                                                        e.target.onerror = null;
                                                        e.target.src = 'https://placehold.co/800x500?text=No+Image';
                                                    }}
                                                />
                                            </div>
                                            <div className="absolute flex items-center gap-1 px-2 py-1 text-xs text-white bg-black rounded top-2 left-2 bg-opacity-70">
                                                <FiImage size={12} />
                                                <span>IMG</span>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => removeExistingImage(index)}
                                                className="absolute p-1 text-white transition-opacity bg-red-600 rounded-full opacity-0 top-2 right-2 group-hover:opacity-100 hover:bg-red-700"
                                                title="Delete image"
                                            >
                                                <FiX size={16} />
                                            </button>
                                        </div>
                                    ))}
                                    
                                    {/* Existing Videos */}
                                    {existingVideos.map((video, index) => (
                                        <div key={`vid-${index}`} className="relative group">
                                            <div className="h-32 overflow-hidden bg-gray-200 rounded-lg">
                                                <video
                                                    src={video}
                                                    className="object-cover w-full h-full"
                                                    muted
                                                />
                                                <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30">
                                                    <FiPlay className="w-8 h-8 text-white" />
                                                </div>
                                            </div>
                                            <div className="absolute flex items-center gap-1 px-2 py-1 text-xs text-white bg-black rounded top-2 left-2 bg-opacity-70">
                                                <FiVideo size={12} />
                                                <span>VID</span>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => removeExistingVideo(index)}
                                                className="absolute p-1 text-white transition-opacity bg-red-600 rounded-full opacity-0 top-2 right-2 group-hover:opacity-100 hover:bg-red-700"
                                                title="Delete video"
                                            >
                                                <FiX size={16} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                        
                        {/* New Media Upload */}
                        <div>
                            <h4 className="mb-2 font-medium text-gray-700">Add New Media</h4>
                            
                            {/* Media Upload */}
                            <div className="mb-4">
                                <label className="block mb-2 text-sm font-medium text-gray-700">
                                    Upload Images & Videos
                                </label>
                                <div className="flex items-center">
                                    <label className="flex items-center justify-center w-full p-4 transition-colors border-2 border-gray-300 border-dashed rounded-lg cursor-pointer hover:border-emerald-500">
                                        <input
                                            type="file"
                                            className="hidden"
                                            accept="image/*,video/*"
                                            multiple
                                            onChange={handleMediaChange}
                                        />
                                        <div className="text-center">
                                            <div className="flex items-center justify-center mb-3 space-x-2">
                                                <FiImage className="text-gray-400" size={24} />
                                                <FiVideo className="text-gray-400" size={24} />
                                            </div>
                                            <p className="text-sm text-gray-600">Click to upload images and videos</p>
                                            <p className="mt-1 text-xs text-gray-500">
                                                Images: PNG, JPG (Max: 10MB) | Videos: MP4, MOV (Max: 100MB)
                                            </p>
                                        </div>
                                    </label>
                                </div>
                            </div>
                            
                            {/* New Media Preview */}
                            {mediaFiles.length > 0 && (
                                <div>
                                    <h4 className="mb-2 font-medium text-gray-700">New Media to Upload ({mediaFiles.length} files)</h4>
                                    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
                                        {mediaFiles.map((file, index) => (
                                            <div key={index} className="relative group">
                                                <div className="h-32 overflow-hidden rounded-lg">
                                                    {file.isImage ? (
                                                        <img 
                                                            src={file.preview} 
                                                            alt={`Upload preview ${index + 1}`} 
                                                            className="object-cover w-full h-full" 
                                                        />
                                                    ) : (
                                                        <div className="relative w-full h-full bg-gray-200">
                                                            <video
                                                                src={file.preview}
                                                                className="object-cover w-full h-full"
                                                                muted
                                                            />
                                                            <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30">
                                                                <FiPlay className="w-8 h-8 text-white" />
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                                
                                                {/* File info overlay */}
                                                <div className="absolute bottom-0 left-0 right-0 p-2 text-xs text-white transition-opacity bg-black rounded-b-lg opacity-0 bg-opacity-70 group-hover:opacity-100">
                                                    <div className="truncate">{file.name}</div>
                                                    <div>{file.sizeInMB}MB</div>
                                                </div>
                                                
                                                {/* Media type indicator */}
                                                <div className="absolute flex items-center gap-1 px-2 py-1 text-xs text-white rounded top-2 left-2 bg-emerald-600 bg-opacity-90">
                                                    {file.isImage ? (
                                                        <>
                                                            <FiImage size={12} />
                                                            <span>NEW</span>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <FiVideo size={12} />
                                                            <span>NEW</span>
                                                        </>
                                                    )}
                                                </div>
                                                
                                                <button
                                                    type="button"
                                                    onClick={() => removeMediaFile(index)}
                                                    className="absolute p-1 text-white transition-opacity bg-red-600 rounded-full opacity-0 top-2 right-2 group-hover:opacity-100 hover:bg-red-700"
                                                    title="Remove from upload queue"
                                                >
                                                    <FiX size={16} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                    
                    {/* Progress Bar for Media Uploads */}
                    {isSubmitting && mediaFiles.length > 0 && (
                        <div className="p-4 bg-white rounded-lg shadow-subtle">
                            <h4 className="mb-2 font-medium text-gray-700">Uploading Media: {uploadProgress}%</h4>
                            <div className="w-full bg-gray-200 rounded-full h-2.5">
                                <div 
                                    className="bg-emerald-600 h-2.5 rounded-full transition-all duration-300" 
                                    style={{ width: `${uploadProgress}%` }}
                                ></div>
                            </div>
                            <p className="mt-2 text-sm text-gray-600">Please wait while files are being uploaded...</p>
                        </div>
                    )}
                    
                    {/* Form Actions */}
                    <div className="flex items-center justify-end p-6 space-x-4 bg-white rounded-lg shadow-subtle">
                        <button
                            type="button"
                            onClick={() => navigate('/agent/properties')}
                            className="px-6 py-3 text-gray-700 transition-colors border border-gray-300 rounded-lg hover:bg-gray-50"
                            disabled={isSubmitting}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="flex items-center px-6 py-3 text-white transition-colors rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? (
                                <>
                                    <svg className="w-4 h-4 mr-2 -ml-1 text-white animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    {mediaFiles.length > 0 ? `Uploading... ${uploadProgress}%` : 'Saving Changes...'}
                                </>
                            ) : (
                                <>
                                    <FiSave className="mr-2" />
                                    Save Changes
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </DashboardLayout>
    );
};

export default EditProperty;