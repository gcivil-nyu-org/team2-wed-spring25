# class TestConsumer(AsyncWebsocketConsumer):
#     async def connect(self):
#         await self.accept()
#         await self.send(
#             text_data=json.dumps(
#                 {"type": "connection_established", \
# "message": "Connection established!"}
#             )
#         )
