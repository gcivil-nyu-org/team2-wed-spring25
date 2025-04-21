"use client"; // Ensures this only runs on client-side
import clsx from "clsx";
import {
  getLastMessageTimeStampAMPM,
  isMessageSentWithin15Mins,
  isMessageSentWithin2Days,
} from "@/utils/datetime";
import Image from "next/image";
import Loader from "../../Loader/Loader";
import useChatMessage from "./useChatMessage";
import { useNotification } from "@/app/custom-components/ToastComponent/NotificationContext";
import { useEffect, useLayoutEffect } from "react";
import Icon from "@/components/atom/Icon/Icon";
import ChatInput from "../ChatInput/ChatInput";

const Message = ({
  message,
  openSettingsId,
  setOpenSettingsId,
  setChatUserList,
  selectedUser,
  messagesContainerRef,
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
    settingsDivDirection,
    setSettingsDivDirection,
    isEditDialogOpen,
    setIsEditDialogOpen,
  } = useChatMessage(
    message,
    openSettingsId,
    setOpenSettingsId,
    setChatUserList,
    selectedUser
  );

  useLayoutEffect(() => {
    if (messagesContainerRef.current && settingsRef.current && isSettingsOpen) {
      const container = messagesContainerRef.current.getBoundingClientRect();
      const settings = settingsRef.current.getBoundingClientRect();

      const isOverlapping =
        settings.top < container.top ||
        settings.bottom > container.bottom ||
        settings.left < container.left ||
        settings.right > container.right;

      //set the direction of the settings div based on the position of the message and the container
      //  setSettingsDivDirection,
      let direction = "left-bottom"; // Default direction
      if (settings.bottom > container.bottom) {
        if (settings.left < container.left) {
          direction = "right-top"; // Right top
        } else {
          direction = "left-top"; // Left top
        }
      } else {
        if (settings.left < container.left) {
          direction = "right-bottom"; // Right bottom
        } else {
          direction = "left-bottom"; // Left bottom
        }
      }
      console.log("Settings div direction:", direction);

      setSettingsDivDirection(direction);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSettingsOpen]);
  const settingsClasses = clsx("absolute z-10 chatBackgroundDark w-40", {
    "top-6": settingsDivDirection === "left-bottom",
    "bottom-6": settingsDivDirection === "left-top",
    "left-6 bottom-2": settingsDivDirection === "right-top",
    "left-6 bottom-6": settingsDivDirection === "right-bottom",
  });

  if (currentUserId === null) {
    return;
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
        if (isMessageSentWithin15Mins(message.timestamp) === false) {
          showError(
            "You can only edit messages sent within the last 15 minutes."
          );
          return;
        }
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
      data-testid="message-wrapper"
      className={`flex my-2 mx-6 ${
        currentUserId == message.sender_id ? "justify-end" : "justify-start"
      }`}
    >
      {isEditDialogOpen && (
        <div className="fixed top-0 left-0 w-screen h-screen bg-black bg-opacity-30 z-20 flex justify-center items-center">
          <div className="bg-bg-forum rounded-lg z-30 flex flex-col w-screen sm:w-96">
            <div className="flex gap-4 items-center px-6 py-4 ">
              <Icon
                width={28}
                height={28}
                src="/icons/close-dark.svg"
                onClick={() => {
                  setIsEditDialogOpen(false);
                  console.log("Edit dialog closed");
                }}
                alt={"Close icon"}
              />
              <h2 className="text-white text-lg hover:cursor-default">
                Edit message
              </h2>
            </div>
            <div className="bg-black flex-1 flex  justify-center items-center">
              <div className="bg-bg-forum inline-flex flex-col px-3 py-1 rounded-md my-12">
                <div className=" ">
                  <p className="text-white">{message.content}</p>
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
            <div>
              <ChatInput
                selectedUser={selectedUser}
                setChatUserList={setChatUserList}
                isEdit={true}
                messageId={message.id}
                initialContent={message.content}
                closeEditDialog={() => {
                  setIsEditDialogOpen(false);
                }}
              />
            </div>
          </div>
        </div>
      )}

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
              <div ref={settingsRef} className={`${settingsClasses}`}>
                <ul className="my-2 w-full overflow-auto">
                  {messageSettings.map((setting) => (
                    <li className="w-full" key={setting.id}>
                      <button
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
