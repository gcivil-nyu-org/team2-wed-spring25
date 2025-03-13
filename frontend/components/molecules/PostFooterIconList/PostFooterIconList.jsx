import React from 'react';
import IconText from '../IconText/IconText';
import LikeOptionList from '../LikeOptionList/LikeOptionList';

const PostFooterIconList = () => {
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
    return (
        <div className='flex flex-1'>
            <div className="flex-1 relative group">
                {/* IconText Component */}
                <IconText
                    src={iconsData[0].src}
                    width={iconsData[0].width}
                    height={iconsData[0].height}
                    alt={iconsData[0].alt}
                    text={iconsData[0].text}
                />

                {/* Tooltip Div */}
                <div className="absolute -top-10 left-1/2 transform -translate-x-1/2 bg-white  px-3 py-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <LikeOptionList />
                </div>
            </div>
            <div className='flex-1'>
                <IconText
                    src={iconsData[1].src}
                    width={iconsData[1].width}
                    height={iconsData[1].height}
                    alt={iconsData[1].alt}
                    text={iconsData[1].text}
                />
            </div>
            <div className='flex-1'>
                <IconText
                    src={iconsData[2].src}
                    width={iconsData[2].width}
                    height={iconsData[2].height}
                    alt={iconsData[2].alt}
                    text={iconsData[2].text}
                />
            </div>
            <div className='flex-1'>
                <IconText
                    src={iconsData[3].src}
                    width={iconsData[3].width}
                    height={iconsData[3].height}
                    alt={iconsData[3].alt}
                    text={iconsData[3].text}
                />
            </div>
        </div>
    );
};

export default PostFooterIconList;