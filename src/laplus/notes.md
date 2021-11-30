## commands

- /mix (url)
  - [x] queue input url
  - [x] queue related
  - [x] skip songs over a certain length
  - [ ] if there's already a mix, add a confirmation message to replace it
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
- [ ] proper logger

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
- [x] current playing time as loading bar
- [x] instead of total songs, show count for non-visible songs (`Math.max(total - 5, 0)`, hidden if 0)
- [x] show total length in footer
- [ ] arrows to navigate pages
- [ ] close button

## bugs

- [ ] fix streams sometimes ending early with no error
  - at the moment, the queue player tries to advance immediately when going idle. it should wait a bit (presumably for the network to wake up again), _then_ advance if still idle
- [x] errors get shown twice
- [ ] sometimes 403 happens and stops the stream, but if seeking works, can use that as a form of recovery
- [ ] retry on 403 when running ytdl
- [ ] don't show "0 skipped"
