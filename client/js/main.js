import file from './file'
import chatClient from './chatClient'
import photobooth from './photobooth'

if (location.pathname === '/file') file()
if (location.pathname === '/chatClient') chatClient()
if (location.pathname === '/photobooth') photobooth()

alert('ghllo')