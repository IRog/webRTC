import file from './file'
import chatClient from './chatClient'
import photobooth from './photobooth'

if (location.pathname === '/file-share') file()
if (location.pathname === '/video-chat') chatClient()
if (location.pathname === '/photobooth') photobooth()