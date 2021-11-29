## commands

- /mix (url)
  - [x] queue input url
  - [x] queue related
  - [x] skip songs over a certain length
  - [ ] if there's already a mix, add a confirmation message
- [x] /status
- [x] /skip (count=1)
- [x] /clear
- [ ] /add (url) (position?)
- [ ] /pause and /resume
- [ ] /seek (seconds)
- /remove
  - [ ] show a dropdown menu with all of the songs in the queue
  - [ ] click to uncheck songs, all initially checked
  - [ ] remove all unchecked songs (keep checked songs)
  - [ ] paginate this
  - [ ] consider an autocomplete option when that comes out
- [ ] /search (or just make /mix do a search on an invalid url)

## internal

- [x] on errors, show the related url that couldn't load

## features

- [ ] get more related videos when queue ends
- persist player state via github gist
  - [x] current playing song
  - [x] queue
  - [ ] song position
  - [ ] voice channel - re-join the channel on startup
- [ ] role-based permissions

## status enhancements

- [x] current playing time
- [ ] current playing time as loading bar
- [ ] show total length in footer
- [ ] arrows to navigate pages
- [ ] close button
