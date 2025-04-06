"use client";
const Message = ({ message }) => {
  const user = JSON.parse(localStorage.getItem("user"));
  const currentUserId = user.id; // Assuming you have the current user's ID from local storage

  return (
    <div
      className={`flex my-2 mx-6 ${
        currentUserId == message.sender_id ? "justify-end" : "justify-start"
      }`}
    >
      <div
        className={`text-white  px-2 py-1 bg-bg-forum rounded-lg inline-block`}
      >
        <p>{message.content}</p>
      </div>
    </div>
  );
};

export default Message;
