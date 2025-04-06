"use client";

import Image from "next/image";

const Message = ({ message }) => {
  const user = JSON.parse(localStorage.getItem("user"));
  const currentUserId = user.id; // Assuming you have the current user's ID from local storage

  const getLastMessageTimeStampAMPM = (timestamp) => {
    const date = new Date(timestamp);

    const hours = date.getHours();
    const minutes = date.getMinutes();
    const ampm = hours >= 12 ? "PM" : "AM";

    // Remove leading zero by converting to number and back
    const formattedHours = parseInt(hours % 12 || 12).toString();
    const formattedMinutes = minutes.toString().padStart(2, "0");

    return `${formattedHours}:${formattedMinutes} ${ampm}`;
  };

  return (
    <div
      className={`flex my-2 mx-6 ${
        currentUserId == message.sender_id ? "justify-end" : "justify-start"
      }`}
    >
      <div
        className={`text-forum-subheading  px-2 py-1 bg-bg-forum rounded-lg flex`}
      >
        <div className="">
          <div className="flex">
            <p>{message.content}</p>
          </div>
          <div className="flex justify-end items-center">
            <p className="pl-6 text-xs text-gray-400 leading-none">
              {getLastMessageTimeStampAMPM(message.timestamp)}
            </p>
            {message.sender_id == currentUserId && (
              <Image
                src={
                  message.read
                    ? "/icons/message_seen.svg"
                    : "/icons/message_unseen.svg"
                }
                width={23}
                height={23}
                alt="Image Picker"
                className="pl-2"
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Message;
