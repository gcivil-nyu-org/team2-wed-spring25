"use client"; // Ensures this only runs on client-side

import { getLastMessageTimeStampAMPM } from "@/utils/datetime";
import Image from "next/image";
import Loader from "../../Loader/Loader";
import useChatMessage from "./useChatMessage";

const Message = ({ message }) => {
  const { currentUserId } = useChatMessage();
  if (currentUserId === null) {
    return <Loader />;
  }

  return (
    <div
      className={`flex my-2 mx-6 ${
        currentUserId == message.sender_id ? "justify-end" : "justify-start"
      }`}
    >
      <div
        className={`text-forum-subheading px-2 py-1 bg-bg-forum rounded-lg flex ${
          currentUserId == message.sender_id ? "ml-8" : "mr-8"
        }`}
      >
        <div className={``}>
          <div className={`flex `}>
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
                alt="Message status"
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
