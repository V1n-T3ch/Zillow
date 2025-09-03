import { useEffect, useState, useCallback } from 'react';
import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    sendPasswordResetEmail,
    onAuthStateChanged,
    GoogleAuthProvider,
    signInWithPopup,
    updateProfile
} from 'firebase/auth';
import { auth, db } from '../firebase';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import AuthContext from './auth/AuthContext';

export function AuthProvider({ children }) {
    const [currentUser, setCurrentUser] = useState(null);
    const [userDetails, setUserDetails] = useState(null);
    const [loading, setLoading] = useState(true);
    const [authRedirectPath, setAuthRedirectPath] = useState(null);

    // Function to handle redirects after auth
    const redirectAfterAuth = (path = '/') => {
        setAuthRedirectPath(path);
    };

    // Clear the redirect path once it's been used
    const clearRedirectPath = () => {
        setAuthRedirectPath(null);
    };

    async function signup(email, password, name, redirectPath) {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);

        // Update profile with name
        await updateProfile(userCredential.user, {
            displayName: name
        });

        // Create user document in Firestore
        await setDoc(doc(db, 'users', userCredential.user.uid), {
            name,
            email,
            role: 'user', // Default role
            createdAt: serverTimestamp()
        });

        // Set redirect path if provided
        if (redirectPath) {
            redirectAfterAuth(redirectPath);
        }

        return userCredential;
    }

    async function login(email, password, redirectPath) {
        const result = await signInWithEmailAndPassword(auth, email, password);

        // Set redirect path if provided
        if (redirectPath) {
            redirectAfterAuth(redirectPath);
        }

        return result;
    }

    async function googleSignIn(redirectPath) {
        const provider = new GoogleAuthProvider();
        const result = await signInWithPopup(auth, provider);

        // Check if user document exists
        const userDoc = await getDoc(doc(db, 'users', result.user.uid));

        // If user doesn't exist in database, create record
        if (!userDoc.exists()) {
            await setDoc(doc(db, 'users', result.user.uid), {
                name: result.user.displayName,
                email: result.user.email,
                role: 'user',
                createdAt: serverTimestamp(),
                photoURL: result.user.photoURL
            });
        }

        // Set redirect path if provided
        if (redirectPath) {
            redirectAfterAuth(redirectPath);
        }

        return result;
    }

    function logout() {
        return signOut(auth);
    }

    function resetPassword(email) {
        return sendPasswordResetEmail(auth, email);
    }

    const fetchUserDetails = useCallback(async (uid) => {
        try {
            const userDoc = await getDoc(doc(db, 'users', uid));
            if (userDoc.exists()) {
                setUserDetails(userDoc.data());
                return userDoc.data();
            }
            return null;
        } catch (error) {
            console.error("Error fetching user details:", error);
            return null;
        }
    }, []);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            setCurrentUser(user);
            if (user) {
                await fetchUserDetails(user.uid);
            } else {
                setUserDetails(null);
            }
            setLoading(false);
        });

        return unsubscribe;
    }, [fetchUserDetails]);

    const value = {
        currentUser,
        userDetails,
        signup,
        login,
        googleSignIn,
        logout,
        resetPassword,
        fetchUserDetails,
        authRedirectPath,
        clearRedirectPath
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
}