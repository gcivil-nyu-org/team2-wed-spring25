'use client'
import { useEffect, useState } from "react";
import { apiGet } from "@/utils/fetch/fetch";

export default function useForum() {
    const [isOpen, setIsOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [userPosts, setUserPosts] = useState([]);
    const handleClick = () => {
        setIsOpen(!isOpen);
    }
    let userData = null
    if (typeof window !== 'undefined') {
        userData = localStorage.getItem('user');
    }
    const user = JSON.parse(userData);
    useEffect(() => {
        const fetchPosts = async () => {
            try{
                const response = await apiGet("/api/forum/posts");
                console.log(response);
                
                if (response) {
                    setUserPosts(response);
                    
                }
            }catch (error) {
                console.error('Error fetching posts:', error);
            }finally {
                setIsLoading(false);
            }
        }
        fetchPosts();
    }, []);
    return {
        isLoading,
        isOpen,
        userPosts,
        handleClick,
        user,
    }
}