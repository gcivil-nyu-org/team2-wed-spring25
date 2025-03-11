import React from 'react';
import IconText from '../IconText/IconText';

const IconList = () => {
    const iconsData = [
        {
            src: "/icons/like.svg",
            width: 12,
            height: 12,
            alt: "Likes",
            text: "Likes",
        },
        {
            src: "/icons/comment.svg",
            width: 20,
            height: 20,
            alt: "Comments",
            text: "Comments",
        },
        {
            src: "/icons/repost.svg",
            width: 15,
            height: 15,
            alt: "Reposts",
            text: "Reposts",
        },
        {
            src: "/icons/send.svg",
            width: 12,
            height: 12,
            alt: "Send",
            text: "Send",
        },
    ];
    return iconsData.map((icon, index) => (
        <IconText
            key={index} // Use index as the key (or a unique ID if available)
            src={icon.src}
            width={icon.width}
            height={icon.height}
            alt={icon.alt}
            text={icon.text}
        />
    ));
};

export default IconList;