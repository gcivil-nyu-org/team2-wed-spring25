"use client"; // Ensures this only runs on client-side

import {
  getLastMessageTimeStampAMPM,
  isMessageSentWithin2Days,
} from "@/utils/datetime";
import Image from "next/image";
import Loader from "../../Loader/Loader";
import useChatMessage from "./useChatMessage";
import { useNotification } from "@/app/custom-components/ToastComponent/NotificationContext";

const Message = ({
  message,
  openSettingsId,
  setOpenSettingsId,
  setChatUserList,
  selectedUser,
}) => {
  const { showError } = useNotification();
  const {
    currentUserId,
    isSettingsOpen,
    handleSettingsClick,
    settingsRef,

    handleCopy,
    handleDelete,
    handleEdit,
    isDeleteDialogOpen,
    setIsDeleteDialogOpen,
    deleteMessage,
  } = useChatMessage(
    message,
    openSettingsId,
    setOpenSettingsId,
    setChatUserList,
    selectedUser
  );
  if (currentUserId === null) {
    return <Loader />;
  }
  const messageSettings = [
    // {
    //   id: 1,
    //   title: "Message Info",
    //   onClick: () => {
    //     setOpenSettingsId(null);
    //     console.log("Message Info clicked");
    //   },
    // },
    // {
    //   id: 2,
    //   title: "Reply",
    //   onClick: () => {
    //     setOpenSettingsId(null);
    //     console.log("Reply clicked");
    //   },
    // },
    {
      id: 3,
      title: "Copy",
      onClick: () => {
        setOpenSettingsId(null);
        handleCopy();
      },
    },
    // {
    //   id: 4,
    //   title: "React",
    //   onClick: () => {
    //     setOpenSettingsId(null);
    //     console.log("React clicked");
    //   },
    // },
    // {
    //   id: 5,
    //   title: "Forward",
    //   onClick: () => {
    //     setOpenSettingsId(null);
    //     console.log("Forward clicked");
    //   },
    // },
    // {
    //   id: 6,
    //   title: "Pin",
    //   onClick: () => {
    //     setOpenSettingsId(null);
    //     console.log("Pin clicked");
    //   },
    // },
    // {
    //   id: 7,
    //   title: "Star",
    //   onClick: () => {
    //     setOpenSettingsId(null);
    //     console.log("Star clicked");
    //   },
    // },
    {
      id: 8,
      title: "Edit",
      onClick: () => {
        setOpenSettingsId(null);
        handleEdit();
      },
    },
    {
      id: 9,
      title: "Delete",
      onClick: () => {
        setOpenSettingsId(null);
        handleDelete();
      },
    },
  ];

  return (
    <div
      className={`flex my-2 mx-6 ${
        currentUserId == message.sender_id ? "justify-end" : "justify-start"
      }`}
    >
      {isDeleteDialogOpen && (
        <div className="fixed top-0 left-0 w-screen h-screen bg-black bg-opacity-30 z-20 flex justify-center items-center">
          <div className="bg-bg-forum rounded-lg p-6 gap-8 z-30 flex flex-col w-screen sm:w-96">
            <h2 className="text-white">Delete message?</h2>
            <div className="flex flex-col items-end gap-4">
              {isMessageSentWithin2Days(message.timestamp) && (
                <button
                  className="text-forum-subheading2 px-4 py-2 rounded-full border border-gray-600 hover:text-forum-heading"
                  onClick={() => {
                    deleteMessage("everyone");
                  }}
                >
                  Delete for everyone
                </button>
              )}
              <button
                className="text-forum-subheading2 px-4 py-2 rounded-full border border-gray-600 hover:text-forum-heading"
                onClick={() => {
                  deleteMessage("self");
                }}
              >
                Delete for me
              </button>
              <button
                className="text-forum-subheading2 px-4 py-2 rounded-full border border-gray-600 hover:text-forum-heading"
                onClick={() => setIsDeleteDialogOpen(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
      <div
        className={`text-forum-subheading px-2 py-1.5 bg-bg-forum rounded-lg flex ${
          currentUserId == message.sender_id ? "ml-8" : "mr-8"
        }`}
      >
        <div className={`relative group hover:cursor-text`}>
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
              <div ref={settingsRef} className="z-10 chatBackgroundDark w-40 ">
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
