import { useState } from 'react';
import { Link } from 'react-router-dom';
import { FiHeart, FiExternalLink, FiCamera } from 'react-icons/fi';
import { TbBed, TbBath, TbRuler, TbBuildingEstate } from 'react-icons/tb';

const PropertyCard = ({ property, onFavoriteToggle, viewMode = 'grid' }) => {
    const { id, title, price, bedrooms, bathrooms, sqft, imageUrl, address, status, isNewListing, isFavorite, description, type, yearBuilt } = property;
    const [isHovered, setIsHovered] = useState(false);

    if (viewMode === 'list') {
        return (
            <div
                className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 border border-gray-100 flex flex-col md:flex-row"
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
            >
                <div className="relative md:w-2/5">
                    <div className="aspect-w-16 aspect-h-10 md:aspect-none md:h-full">
                        <img
                            src={imageUrl}
                            alt={title}
                            className="object-cover w-full h-full transition-transform duration-700 ease-in-out group-hover:scale-110"
                        />
                        <div className={`absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-${isHovered ? '100' : '70'} transition-opacity duration-300`}></div>
                    </div>

                    {/* Badges */}
                    <div className="absolute top-4 left-4 flex flex-col gap-2">
                        {isNewListing && (
                            <span className="bg-emerald-500 text-white px-3 py-1 rounded-full text-xs font-medium tracking-wide shadow-sm">
                                New
                            </span>
                        )}
                        <span className={`${status === 'For Sale' ? 'bg-amber-500' : 'bg-violet-600'} text-white px-3 py-1 rounded-full text-xs font-medium tracking-wide shadow-sm`}>
                            {status}
                        </span>
                    </div>

                    {/* Photo count */}
                    <div className="absolute bottom-4 left-4">
                        <span className="flex items-center bg-black/50 backdrop-blur-sm text-white text-xs px-2 py-1 rounded-full">
                            <FiCamera className="mr-1" /> 12 Photos
                        </span>
                    </div>

                    {/* Favorite button */}
                    <button
                        onClick={(e) => {
                            e.preventDefault();
                            onFavoriteToggle();
                        }}
                        className={`absolute top-4 right-4 p-2 rounded-full transition-all duration-300 ${isFavorite
                                ? 'bg-rose-500 text-white'
                                : 'bg-black/30 backdrop-blur-sm text-white hover:bg-rose-500/70'
                            }`}
                    >
                        <FiHeart className={isFavorite ? "fill-white" : ""} size={18} />
                    </button>
                </div>

                <div className="p-5 md:p-6 flex-1 flex flex-col justify-between">
                    <div>
                        <div className="flex justify-between items-start">
                            <div>
                                <span className="text-xs font-medium px-2 py-1 rounded-full bg-gray-100 text-gray-600 mb-2 inline-block">
                                    <TbBuildingEstate className="inline mr-1" /> {type}
                                </span>
                                <h3 className="text-xl font-bold text-gray-800 mb-1 mt-2">{title}</h3>
                            </div>
                            <p className="text-2xl font-bold text-emerald-600">
                                ${price.toLocaleString()}
                                {status === 'For Rent' && <span className="text-sm font-normal text-gray-500">/mo</span>}
                            </p>
                        </div>

                        <p className="text-gray-500 mb-4">{address}</p>

                        <div className="flex flex-wrap gap-4 mb-4">
                            <span className="flex items-center text-gray-700">
                                <TbBed className="mr-2 text-gray-400" size={20} /> <span className="font-medium">{bedrooms}</span> <span className="text-gray-400 text-sm ml-1">Beds</span>
                            </span>
                            <span className="flex items-center text-gray-700">
                                <TbBath className="mr-2 text-gray-400" size={20} /> <span className="font-medium">{bathrooms}</span> <span className="text-gray-400 text-sm ml-1">Baths</span>
                            </span>
                            <span className="flex items-center text-gray-700">
                                <TbRuler className="mr-2 text-gray-400" size={20} /> <span className="font-medium">{sqft.toLocaleString()}</span> <span className="text-gray-400 text-sm ml-1">sqft</span>
                            </span>
                        </div>

                        <p className="text-gray-600 mb-4 line-clamp-2">{description}</p>

                        <div className="text-xs text-gray-500">
                            Year built: {yearBuilt} • Added 2 days ago
                        </div>
                    </div>

                    <div className="mt-5 flex justify-between items-center">
                        <Link
                            to={`/properties/${id}`}
                            className="group relative bg-emerald-50 text-emerald-700 py-2.5 px-5 rounded-full hover:bg-emerald-600 hover:text-white font-medium transition-all duration-300 overflow-hidden"
                        >
                            <span className="relative flex items-center z-10">
                                View Details <FiExternalLink className="ml-1.5 transform group-hover:translate-x-1 transition-transform" />
                            </span>
                        </Link>

                        <button className="text-gray-400 hover:text-gray-600 transition-colors">
                            Contact Agent
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div
            className="group bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            <div className="relative overflow-hidden">
                <div className="aspect-w-4 aspect-h-3">
                    <img
                        src={imageUrl}
                        alt={title}
                        className="object-cover w-full h-full transition-transform duration-700 ease-in-out group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
                </div>

                {/* Badges */}
                <div className="absolute top-4 left-4 flex flex-col gap-2">
                    {isNewListing && (
                        <span className="bg-emerald-500 text-white px-3 py-1 rounded-full text-xs font-medium tracking-wide shadow-sm">
                            New
                        </span>
                    )}
                    <span className={`${status === 'For Sale' ? 'bg-amber-500' : 'bg-violet-600'} text-white px-3 py-1 rounded-full text-xs font-medium tracking-wide shadow-sm`}>
                        {status}
                    </span>
                </div>

                {/* Photo count */}
                <div className="absolute bottom-4 left-4">
                    <span className="flex items-center bg-black/50 backdrop-blur-sm text-white text-xs px-2 py-1 rounded-full">
                        <FiCamera className="mr-1" /> 12 Photos
                    </span>
                </div>

                {/* Price tag */}
                <div className="absolute bottom-4 right-4">
                    <span className="bg-white/90 backdrop-blur-sm text-emerald-700 px-3 py-1.5 rounded-lg font-bold shadow-sm">
                        Ksh.{(price || 0).toLocaleString()}{status === 'For Rent' && <span className="text-xs font-normal text-gray-500">/mo</span>}
                    </span>
                </div>

                {/* Favorite button */}
                <button
                    onClick={(e) => {
                        e.preventDefault();
                        onFavoriteToggle();
                    }}
                    className={`absolute top-4 right-4 p-2 rounded-full transition-all duration-300 ${isFavorite
                            ? 'bg-rose-500 text-white'
                            : 'bg-black/30 backdrop-blur-sm text-white hover:bg-rose-500/70'
                        }`}
                >
                    <FiHeart className={isFavorite ? "fill-white" : ""} size={18} />
                </button>
            </div>

            <div className="p-5">
                <div className="flex justify-between">
                    <span className="text-xs font-medium px-2 py-1 rounded-full bg-gray-100 text-gray-600">
                        <TbBuildingEstate className="inline mr-1" /> {type}
                    </span>
                    <div className="text-xs text-gray-400">
                        Added 2 days ago
                    </div>
                </div>

                <h3 className="text-lg font-bold text-gray-800 mt-2 mb-1">{title}</h3>
                <p className="text-gray-500 text-sm mb-3">{address}</p>

                <div className="flex justify-between mb-4">
                    <span className="flex items-center text-gray-700">
                        <TbBed className="mr-1 text-gray-400" /> <span className="font-medium">{bedrooms}</span>
                    </span>
                    <span className="flex items-center text-gray-700">
                        <TbBath className="mr-1 text-gray-400" /> <span className="font-medium">{bathrooms}</span>
                    </span>
                    <span className="flex items-center text-gray-700">
                        <TbRuler className="mr-1 text-gray-400" /> <span className="font-medium">{(sqft || 0).toLocaleString()}</span>
                    </span>
                </div>

                <div className="pt-3 border-t border-gray-100">
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