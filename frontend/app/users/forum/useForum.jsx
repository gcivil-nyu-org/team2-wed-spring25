import { useEffect, useState } from "react";
import { apiGet } from "@/utils/fetch/fetch";

export default function useForum() {
    const [isOpen, setIsOpen] = useState(false);
    const [userPosts, setUserPosts] = useState([]);
    const handleClick = () => {
        setIsOpen(!isOpen);
    }
    const userData = localStorage.getItem("user");
    const user = JSON.parse(userData);
    useEffect(() => {
        const fetchPosts = async () => {
            const response = await apiGet("/api/forum/posts");
            console.log(response);
            
            if (response) {
                setUserPosts(response);
            }
        }
        fetchPosts();
    }, []);
    return {
        isOpen,
        userPosts,
        handleClick,
        user,
    }
}