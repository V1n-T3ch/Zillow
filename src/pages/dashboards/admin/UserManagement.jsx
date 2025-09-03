import { useState, useEffect } from 'react';
import { FiSearch, FiEdit, FiTrash2, FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import DashboardLayout from '../../../components/dashboard/DashboardLayout';
import { useAuth } from '../../../hooks/useAuth';
import {
    collection, query, where, orderBy,
    doc, updateDoc, deleteDoc, onSnapshot
} from 'firebase/firestore';
import { db } from '../../../firebase';

const UserManagement = () => {
    const { userDetails } = useAuth();
    const [users, setUsers] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [search, setSearch] = useState('');
    const [selectedRole, setSelectedRole] = useState('all');
    const [selectedStatus, setSelectedStatus] = useState('all');
    const [currentPage, setCurrentPage] = useState(1);
    const [usersPerPage] = useState(8);

    useEffect(() => {
        // Check if user is admin
        if (!userDetails || userDetails.role !== 'admin') {
            setError('You do not have permission to access this page');
            setIsLoading(false);
            return;
        }

        // Create a query for users
        const usersRef = collection(db, 'users');
        let usersQuery = query(usersRef, orderBy('createdAt', 'desc'));

        // If role filter is applied, add it to query
        if (selectedRole !== 'all') {
            usersQuery = query(usersQuery, where('role', '==', selectedRole));
        }

        // If status filter is applied, add it to query
        if (selectedStatus !== 'all') {
            usersQuery = query(usersQuery, where('status', '==', selectedStatus));
        }

        // Set up real-time listener
        const unsubscribe = onSnapshot(
            usersQuery,
            (snapshot) => {
                const usersList = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data(),
                    joinDate: doc.data().createdAt?.toDate().toISOString() || new Date().toISOString()
                }));
                setUsers(usersList);
                setIsLoading(false);
            },
            (err) => {
                console.error("Error fetching users:", err);
                setError("Failed to load users. Please try again later.");
                setIsLoading(false);
            }
        );

        // Cleanup listener on component unmount
        return () => unsubscribe();
    }, [userDetails, selectedRole, selectedStatus]);

    const handleStatusChange = async (userId, newStatus) => {
        try {
            // Update the user status in Firestore
            const userRef = doc(db, 'users', userId);
            await updateDoc(userRef, {
                status: newStatus,
                updatedAt: new Date()
            });

            // No need to update local state since we're using onSnapshot
            console.log(`User ${userId} status updated to ${newStatus}`);
        } catch (error) {
            console.error("Error updating user status:", error);
            setError(`Failed to update user status: ${error.message}`);
        }
    };

    const handleRoleChange = async (userId, newRole) => {
        try {
            // Update the user role in Firestore
            const userRef = doc(db, 'users', userId);
            await updateDoc(userRef, {
                role: newRole,
                updatedAt: new Date()
            });

            // No need to update local state since we're using onSnapshot
            console.log(`User ${userId} role updated to ${newRole}`);
        } catch (error) {
            console.error("Error updating user role:", error);
            setError(`Failed to update user role: ${error.message}`);
        }
    };

    const handleDeleteUser = async (userId) => {
        if (!window.confirm("Are you sure you want to permanently delete this user? This action cannot be undone.")) {
            return;
        }

        try {
            // Delete the user from Firestore
            await deleteDoc(doc(db, 'users', userId));

            // No need to update local state since we're using onSnapshot
            console.log(`User ${userId} successfully deleted`);
        } catch (error) {
            console.error("Error deleting user:", error);
            setError(`Failed to delete user: ${error.message}`);
        }
    };

    // Filter users based on search term (client-side filtering for search)
    // Note: We're already filtering by role and status on the server side
    const filteredUsers = users.filter(user => {
        const matchesSearch = user.name?.toLowerCase().includes(search.toLowerCase()) ||
            user.email?.toLowerCase().includes(search.toLowerCase());

        return matchesSearch;
    });

    // Pagination
    const indexOfLastUser = currentPage * usersPerPage;
    const indexOfFirstUser = indexOfLastUser - usersPerPage;
    const currentUsers = filteredUsers.slice(indexOfFirstUser, indexOfLastUser);
    const totalPages = Math.ceil(filteredUsers.length / usersPerPage);

    const paginate = (pageNumber) => {
        setCurrentPage(pageNumber);
        // Scroll to top when changing pages
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const formatDate = (dateString) => {
        const options = { month: 'short', day: 'numeric', year: 'numeric' };
        return new Date(dateString).toLocaleDateString('en-US', options);
    };

    if (error) {
        return (
            <DashboardLayout role="admin">
                <div className="bg-red-50 p-4 rounded-lg border border-red-200 text-red-700">
                    <h3 className="text-lg font-medium mb-2">Error</h3>
                    <p>{error}</p>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout role="admin">
            <div>
                <h2 className="text-2xl font-bold text-gray-800 mb-6">User Management</h2>

                {/* Filters */}
                <div className="bg-white p-4 rounded-lg shadow-subtle mb-6">
                    <div className="flex flex-wrap gap-4">
                        <div className="flex-1 min-w-[280px]">
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <FiSearch className="text-gray-400" />
                                </div>
                                <input
                                    type="text"
                                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                    placeholder="Search users..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                />
                            </div>
                        </div>

                        <div>
                            <select
                                value={selectedRole}
                                onChange={(e) => {
                                    setSelectedRole(e.target.value);
                                    setCurrentPage(1); // Reset to first page when changing filters
                                }}
                                className="block w-full py-2 px-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                            >
                                <option value="all">All Roles</option>
                                <option value="user">User</option>
                                <option value="vendor">Vendor</option>
                                <option value="admin">Admin</option>
                            </select>
                        </div>

                        <div>
                            <select
                                value={selectedStatus}
                                onChange={(e) => {
                                    setSelectedStatus(e.target.value);
                                    setCurrentPage(1); // Reset to first page when changing filters
                                }}
                                className="block w-full py-2 px-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                            >
                                <option value="all">All Statuses</option>
                                <option value="active">Active</option>
                                <option value="pending">Pending</option>
                                <option value="suspended">Suspended</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Users Table */}
                <div className="bg-white rounded-lg shadow-subtle overflow-hidden">
                    {isLoading ? (
                        <div className="p-4 space-y-4">
                            {Array.from({ length: 8 }).map((_, index) => (
                                <div key={index} className="animate-pulse flex items-center py-2">
                                    <div className="w-10 h-10 bg-gray-200 rounded-full mr-4"></div>
                                    <div className="flex-1">
                                        <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
                                        <div className="h-3 bg-gray-200 rounded w-1/3"></div>
                                    </div>
                                    <div className="w-20 h-6 bg-gray-200 rounded mr-2"></div>
                                    <div className="w-20 h-6 bg-gray-200 rounded mr-2"></div>
                                    <div className="w-20 h-6 bg-gray-200 rounded"></div>
                                </div>
                            ))}
                        </div>
                    ) : filteredUsers.length > 0 ? (
                        <>
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                User
                                            </th>
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Role
                                            </th>
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Status
                                            </th>
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Joined
                                            </th>
                                            <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Actions
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {currentUsers.map((user) => (
                                            <tr key={user.id} className="hover:bg-gray-50">
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="flex items-center">
                                                        <div className="flex-shrink-0 h-10 w-10">
                                                            <img
                                                                className="h-10 w-10 rounded-full object-cover"
                                                                src={user.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=random`}
                                                                alt={user.name}
                                                            />
                                                        </div>
                                                        <div className="ml-4">
                                                            <div className="text-sm font-medium text-gray-900">{user.name}</div>
                                                            <div className="text-sm text-gray-500">{user.email}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <select
                                                        value={user.role || 'user'}
                                                        onChange={(e) => handleRoleChange(user.id, e.target.value)}
                                                        className={`text-sm rounded-full px-3 py-1 font-medium ${user.role === 'admin'
                                                                ? 'bg-purple-100 text-purple-800'
                                                                : user.role === 'vendor'
                                                                    ? 'bg-blue-100 text-blue-800'
                                                                    : 'bg-gray-100 text-gray-800'
                                                            }`}
                                                    >
                                                        <option value="user">User</option>
                                                        <option value="vendor">Vendor</option>
                                                        <option value="admin">Admin</option>
                                                    </select>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <select
                                                        value={user.status || 'active'}
                                                        onChange={(e) => handleStatusChange(user.id, e.target.value)}
                                                        className={`text-sm rounded-full px-3 py-1 font-medium ${user.status === 'active'
                                                                ? 'bg-green-100 text-green-800'
                                                                : user.status === 'pending'
                                                                    ? 'bg-yellow-100 text-yellow-800'
                                                                    : 'bg-red-100 text-red-800'
                                                            }`}
                                                    >
                                                        <option value="active">Active</option>
                                                        <option value="pending">Pending</option>
                                                        <option value="suspended">Suspended</option>
                                                    </select>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                    {formatDate(user.joinDate)}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                    <div className="flex justify-end space-x-2">
                                                        <button
                                                            className="p-1.5 bg-blue-50 text-blue-700 rounded hover:bg-blue-100"
                                                            title="Edit User"
                                                            onClick={() => {/* Future implementation - edit user modal */ }}
                                                        >
                                                            <FiEdit size={16} />
                                                        </button>
                                                        <button
                                                            className="p-1.5 bg-red-50 text-red-700 rounded hover:bg-red-100"
                                                            title="Delete User"
                                                            onClick={() => handleDeleteUser(user.id)}
                                                        >
                                                            <FiTrash2 size={16} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Pagination */}
                            <div className="px-6 py-3 flex items-center justify-between border-t border-gray-200">
                                <div className="text-sm text-gray-500">
                                    Showing <span className="font-medium">{indexOfFirstUser + 1}</span> to <span className="font-medium">
                                        {Math.min(indexOfLastUser, filteredUsers.length)}
                                    </span> of <span className="font-medium">{filteredUsers.length}</span> users
                                </div>

                                <nav className="flex items-center space-x-2">
                                    <button
                                        onClick={() => paginate(currentPage - 1)}
                                        disabled={currentPage === 1}
                                        className={`p-2 rounded ${currentPage === 1
                                                ? 'text-gray-300 cursor-not-allowed'
                                                : 'text-gray-600 hover:bg-gray-100'
                                            }`}
                                    >
                                        <FiChevronLeft size={16} />
                                    </button>

                                    {Array.from({ length: Math.min(5, totalPages) }).map((_, index) => {
                                        let pageNumber;
                                        if (totalPages <= 5) {
                                            pageNumber = index + 1;
                                        } else if (currentPage <= 3) {
                                            pageNumber = index + 1;
                                        } else if (currentPage >= totalPages - 2) {
                                            pageNumber = totalPages - 4 + index;
                                        } else {
                                            pageNumber = currentPage - 2 + index;
                                        }

                                        if (pageNumber <= totalPages) {
                                            return (
                                                <button
                                                    key={pageNumber}
                                                    onClick={() => paginate(pageNumber)}
                                                    className={`px-3 py-1 rounded ${currentPage === pageNumber
                                                            ? 'bg-emerald-600 text-white'
                                                            : 'text-gray-600 hover:bg-gray-100'
                                                        }`}
                                                >
                                                    {pageNumber}
                                                </button>
                                            );
                                        }
                                        return null;
                                    })}

                                    <button
                                        onClick={() => paginate(currentPage + 1)}
                                        disabled={currentPage === totalPages}
                                        className={`p-2 rounded ${currentPage === totalPages
                                                ? 'text-gray-300 cursor-not-allowed'
                                                : 'text-gray-600 hover:bg-gray-100'
                                            }`}
                                    >
                                        <FiChevronRight size={16} />
                                    </button>
                                </nav>
                            </div>
                        </>
                    ) : (
                        <div className="bg-white p-8 rounded-lg text-center">
                            <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 text-gray-400 rounded-full mb-4">
                                <FiSearch size={24} />
                            </div>
                            <h3 className="text-xl font-semibold text-gray-800 mb-2">No Users Found</h3>
                            <p className="text-gray-600 mb-6">
                                {search ?
                                    "No users match your search criteria." :
                                    selectedRole !== 'all' || selectedStatus !== 'all' ?
                                        "No users match your filters." :
                                        "There are no users in the system yet."}
                            </p>
                            {(search || selectedRole !== 'all' || selectedStatus !== 'all') && (
                                <button
                                    onClick={() => {
                                        setSearch('');
                                        setSelectedRole('all');
                                        setSelectedStatus('all');
                                    }}
                                    className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
                                >
                                    Clear Filters
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </DashboardLayout>
    );
};

export default UserManagement;