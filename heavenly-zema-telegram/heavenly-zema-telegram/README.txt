HEAVENLY ZEMA - TELEGRAM DOWNLOADER

1. Get your Telegram API keys (one time):
   - Open https://my.telegram.org and log in with the phone number of the account that admins the channel.
   - Click "API development tools", create an app (any name), and note the api_id and api_hash.
2. Double-click run-telegram-download.bat
3. Choose 1 (preview) first. On the first run it asks for api_id, api_hash, the channel (th3906)
   and your library folder, then logs in with your phone number and the code Telegram sends you.
4. If the preview looks right, run option 2 (5 songs) and look at the folders it made,
   then option 3 for everything. You can stop any time and run it again: it carries on where it stopped.

Result:  My Library\Artist\Album (Year)\NN - Title.mp3   (+ cover.jpg when the song has one)
Songs with no artist or album tag go to My Library\_Unsorted so you can sort them by hand.
Add each new artist to artist-names.txt so the folder name matches the name on your site.

KEEP PRIVATE: tg-config.json and telegram.session give access to your Telegram account.
Never share them. To log out, delete telegram.session and end the session in Telegram > Settings > Devices.
