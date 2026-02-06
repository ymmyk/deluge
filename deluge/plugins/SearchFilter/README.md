# SearchFilter Plugin

SearchFilter adds a `Search` section to the top of the Web UI Filters sidebar.
Typing in the search box filters the torrent list by torrent name.

## Features

- Sidebar panel titled `Search` at the top of Filters
- Name-only matching (case-insensitive substring)
- Client-side filtering with debounced input
- No daemon RPC changes

## Build

From this directory:

```bash
python setup.py bdist_egg
```

The plugin egg is created in `dist/`.

## Install (Side-load)

1. Open Deluge Web UI.
2. Go to Preferences -> Plugins.
3. Click Install Plugin.
4. Select the generated `.egg` file from `dist/`.
5. Enable `SearchFilter` in the plugin list.

## Notes

- The plugin currently targets the Web UI.
- If disabled, the Search panel is removed and torrent list filtering is cleared.
