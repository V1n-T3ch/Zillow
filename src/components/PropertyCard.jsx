import { useState } from 'react';
import { Link } from 'react-router-dom';
import { FiHeart, FiExternalLink, FiCamera } from 'react-icons/fi';
import { TbBed, TbBath, TbHome, TbBuildingEstate } from 'react-icons/tb';

const PropertyCard = ({ property, onFavoriteToggle, viewMode = 'grid' }) => {
    const { 
        id, 
        title, 
        price, 
        beds,
        baths,
        imageUrl, 
        images,
        city,
        area,
        status, 
        isNewListing, 
        isFavorite, 
        description, 
        propertyType,
        yearBuilt, 
        listingStatus,
        stories,
        garage 
    } = property;
    
    const [isHovered, setIsHovered] = useState(false);
    const [imageError, setImageError] = useState(false);
    
    // Get the first image from images array or fallback to imageUrl
    const displayImage = !imageError && images && images.length > 0 
        ? images[0] 
        : imageUrl || 'https://placehold.co/600x400?text=No+Image';
    
    // Format location string
    const locationDisplay = city && area 
        ? `${city}, ${area}`
        : city || area || 'Location not specified';
    
    // Count images for badge
    const photoCount = images ? images.length : 0;

    const handleImageError = () => {
        setImageError(true);
    };

    if (viewMode === 'list') {
        return (
            <div
                className="flex flex-col overflow-hidden transition-all duration-300 bg-white border border-gray-100 shadow-sm rounded-xl hover:shadow-lg md:flex-row"
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
            >
                <div className="relative md:w-2/5">
                    <div className="h-64 overflow-hidden md:h-full">
                        <img
                            src={displayImage}
                            alt={title}
                            className="object-cover w-full h-full transition-transform duration-700 ease-in-out group-hover:scale-110"
                            onError={handleImageError}
                        />
                        <div className={`absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-${isHovered ? '100' : '70'} transition-opacity duration-300`}></div>
                    </div>

                    {/* Badges */}
                    <div className="absolute flex flex-col gap-2 top-4 left-4">
                        {isNewListing && (
                            <span className="px-3 py-1 text-xs font-medium tracking-wide text-white rounded-full shadow-sm bg-emerald-500">
                                New
                            </span>
                        )}
                        <span className={`${listingStatus === 'For Sale' ? 'bg-amber-500' : 'bg-violet-600'} text-white px-3 py-1 rounded-full text-xs font-medium tracking-wide shadow-sm`}>
                            {listingStatus || 'For Sale'}
                        </span>
                    </div>

                    {/* Photo count */}
                    <div className="absolute bottom-4 left-4">
                        <span className="flex items-center px-2 py-1 text-xs text-white rounded-full bg-black/50 backdrop-blur-sm">
                            <FiCamera className="mr-1" /> {photoCount} Photos
                        </span>
                    </div>

                    {/* Favorite button */}
                    <button
                        onClick={(e) => {
                            e.preventDefault();
                            if (onFavoriteToggle) onFavoriteToggle();
                        }}
                        className={`absolute top-4 right-4 p-2 rounded-full transition-all duration-300 ${isFavorite
                                ? 'bg-rose-500 text-white'
                                : 'bg-black/30 backdrop-blur-sm text-white hover:bg-rose-500/70'
                            }`}
                    >
                        <FiHeart className={isFavorite ? "fill-white" : ""} size={18} />
                    </button>
                </div>

                <div className="flex flex-col justify-between flex-1 p-5 md:p-6">
                    <div>
                        <div className="flex items-start justify-between">
                            <div>
                                <span className="inline-block px-2 py-1 mb-2 text-xs font-medium text-gray-600 bg-gray-100 rounded-full">
                                    <TbBuildingEstate className="inline mr-1" /> {propertyType || 'Property'}
                                </span>
                                <h3 className="mt-2 mb-1 text-xl font-bold text-gray-800 line-clamp-1">{title}</h3>
                            </div>
                            <p className="text-2xl font-bold text-emerald-600">
                                ${(price || 0).toLocaleString()}
                                {listingStatus === 'For Rent' && <span className="text-sm font-normal text-gray-500">/mo</span>}
                            </p>
                        </div>

                        <p className="mb-4 text-gray-500">{locationDisplay}</p>

                        <div className="flex flex-wrap gap-4 mb-4">
                            <span className="flex items-center text-gray-700">
                                <TbBed className="mr-2 text-gray-400" size={20} /> 
                                <span className="font-medium">{beds || 0}</span> 
                                <span className="ml-1 text-sm text-gray-400">Beds</span>
                            </span>
                            <span className="flex items-center text-gray-700">
                                <TbBath className="mr-2 text-gray-400" size={20} /> 
                                <span className="font-medium">{baths || 0}</span> 
                                <span className="ml-1 text-sm text-gray-400">Baths</span>
                            </span>
                            {stories && (
                                <span className="flex items-center text-gray-700">
                                    <TbHome className="mr-2 text-gray-400" size={20} /> 
                                    <span className="font-medium">{stories}</span> 
                                    <span className="ml-1 text-sm text-gray-400">Stories</span>
                                </span>
                            )}
                        </div>

                        <p className="mb-4 text-gray-600 line-clamp-2">{description}</p>

                        <div className="text-xs text-gray-500">
                            {yearBuilt && `Year built: ${yearBuilt} • `}Added 2 days ago
                        </div>
                    </div>

                    <div className="flex items-center justify-between mt-5">
                        <Link
                            to={`/properties/${id}`}
                            className="group relative bg-emerald-50 text-emerald-700 py-2.5 px-5 rounded-full hover:bg-emerald-600 hover:text-white font-medium transition-all duration-300 overflow-hidden"
                        >
                            <span className="relative z-10 flex items-center">
                                View Details <FiExternalLink className="ml-1.5 transform group-hover:translate-x-1 transition-transform" />
                            </span>
                        </Link>

                        <button className="text-gray-400 transition-colors hover:text-gray-600">
                            Contact Agent
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div
            className="flex flex-col h-full overflow-hidden transition-all duration-300 bg-white border border-gray-100 shadow-sm group rounded-xl hover:shadow-xl"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            <div className="relative overflow-hidden">
                {/* Standardized image container with fixed height */}
                <div className="w-full overflow-hidden h-60">
                    <img
                        src={displayImage}
                        alt={title}
                        className="object-cover w-full h-full transition-transform duration-700 ease-in-out group-hover:scale-110"
                        onError={handleImageError}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
                </div>

                {/* Badges */}
                <div className="absolute flex flex-col gap-2 top-4 left-4">
                    {isNewListing && (
                        <span className="px-3 py-1 text-xs font-medium tracking-wide text-white rounded-full shadow-sm bg-emerald-500">
                            New
                        </span>
                    )}
                    <span className={`${listingStatus === 'For Sale' ? 'bg-amber-500' : 'bg-violet-600'} text-white px-3 py-1 rounded-full text-xs font-medium tracking-wide shadow-sm`}>
                        {listingStatus || 'For Sale'}
                    </span>
                </div>

                {/* Photo count */}
                <div className="absolute bottom-4 left-4">
                    <span className="flex items-center px-2 py-1 text-xs text-white rounded-full bg-black/50 backdrop-blur-sm">
                        <FiCamera className="mr-1" /> {photoCount} Photos
                    </span>
                </div>

                {/* Price tag */}
                <div className="absolute bottom-4 right-4">
                    <span className="bg-white/90 backdrop-blur-sm text-emerald-700 px-3 py-1.5 rounded-lg font-bold shadow-sm">
                        ${(price || 0).toLocaleString()}{listingStatus === 'For Rent' && <span className="text-xs font-normal text-gray-500">/mo</span>}
                    </span>
                </div>

                {/* Favorite button */}
                <button
                    onClick={(e) => {
                        e.preventDefault();
                        if (onFavoriteToggle) onFavoriteToggle();
                    }}
                    className={`absolute top-4 right-4 p-2 rounded-full transition-all duration-300 ${isFavorite
                            ? 'bg-rose-500 text-white'
                            : 'bg-black/30 backdrop-blur-sm text-white hover:bg-rose-500/70'
                        }`}
                >
                    <FiHeart className={isFavorite ? "fill-white" : ""} size={18} />
                </button>
            </div>

            <div className="flex flex-col flex-1 p-5">
                <div className="flex justify-between">
                    <span className="px-2 py-1 text-xs font-medium text-gray-600 bg-gray-100 rounded-full">
                        <TbBuildingEstate className="inline mr-1" /> {propertyType || 'Property'}
                    </span>
                    <div className="text-xs text-gray-400">
                        Added 2 days ago
                    </div>
                </div>

                <h3 className="mt-2 mb-1 text-lg font-bold text-gray-800 line-clamp-1">{title}</h3>
                <p className="mb-3 text-sm text-gray-500">{locationDisplay}</p>

                <div className="flex justify-between mb-4">
                    <span className="flex items-center text-gray-700">
                        <TbBed className="mr-1 text-gray-400" /> <span className="font-medium">{beds || 0}</span>
                    </span>
                    <span className="flex items-center text-gray-700">
                        <TbBath className="mr-1 text-gray-400" /> <span className="font-medium">{baths || 0}</span>
                    </span>
                    {garage && garage !== '0' && (
                        <span className="flex items-center text-gray-700">
                            <TbHome className="mr-1 text-gray-400" /> <span className="font-medium">{garage}</span>
                        </span>
                    )}
                </div>

                {/* Push the button to the bottom using flex-1 spacer */}
                <div className="pt-3 mt-auto border-t border-gray-100">
                    <Link
                        to={`/properties/${id}`}
                        className="block w-full text-center bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-2.5 rounded-lg transition-colors"
                    >
                        View Details
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default PropertyCard;