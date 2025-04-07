"use client"; // Ensures this only runs on client-side

import { getLastMessageTimeStampAMPM } from "@/utils/datetime";
import Image from "next/image";
import Loader from "../../Loader/Loader";
import useChatMessage from "./useChatMessage";

const Message = ({ message, openSettingsId, setOpenSettingsId }) => {
  const { currentUserId, isSettingsOpen, handleSettingsClick, settingsRef } =
    useChatMessage(message, openSettingsId, setOpenSettingsId);
  if (currentUserId === null) {
    return <Loader />;
  }

  const messageSettings = [
    {
      id: 1,
      title: "Message Info",
      onClick: () => {
        setOpenSettingsId(null);
        console.log("Message Info clicked");
      },
    },
    {
      id: 2,
      title: "Reply",
      onClick: () => {
        setOpenSettingsId(null);
        console.log("Reply clicked");
      },
    },
    {
      id: 3,
      title: "Copy",
      onClick: () => {
        setOpenSettingsId(null);
        console.log("Copy clicked");
      },
    },
    {
      id: 4,
      title: "React",
      onClick: () => {
        setOpenSettingsId(null);
        console.log("React clicked");
      },
    },
    {
      id: 5,
      title: "Forward",
      onClick: () => {
        setOpenSettingsId(null);
        console.log("Forward clicked");
      },
    },
    {
      id: 6,
      title: "Pin",
      onClick: () => {
        setOpenSettingsId(null);
        console.log("Pin clicked");
      },
    },
    {
      id: 7,
      title: "Star",
      onClick: () => {
        setOpenSettingsId(null);
        console.log("Star clicked");
      },
    },
    {
      id: 8,
      title: "Delete",
      onClick: () => {
        setOpenSettingsId(null);
        console.log("Delete clicked");
      },
    },
  ];

  return (
    <div
      className={`flex my-2 mx-6 ${
        currentUserId == message.sender_id ? "justify-end" : "justify-start"
      }`}
    >
      <div
        className={`text-forum-subheading px-2 py-1.5 bg-bg-forum rounded-lg flex ${
          currentUserId == message.sender_id ? "ml-8" : "mr-8"
        }`}
      >
        <div className={`relative group hover:cursor-text`}>
          {currentUserId == message.sender_id && (
            <div className="absolute top-0 right-0 flex flex-col items-end">
              <button
                className=" opacity-0 group-hover:opacity-100 bg-gradient-to-r from-transparent to-bg-forum translate-x-3 group-hover:translate-x-0 transition-all duration-300 "
                onClick={handleSettingsClick}
              >
                <Image
                  src={"/icons/down-arrow.svg"}
                  alt="arrow"
                  height={24}
                  width={24}
                  className=""
                />
              </button>
              {isSettingsOpen && (
                <div className="z-10 chatBackgroundDark w-36" ref={settingsRef}>
                  <ul className="my-2 w-full">
                    {messageSettings.map((setting) => (
                      <li className="w-full">
                        <button
                          key={setting.id}
                          className="text-sm text-left w-full text-forum-heading chatHoverDark px-6 py-3"
                          onClick={setting.onClick}
                        >
                          {setting.title}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
          <div className={`flex `}>
            <p>{message.content}</p>
          </div>
          <div className="flex justify-end items-center">
            <p className="pl-6 text-xs chatSubtext leading-none">
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
