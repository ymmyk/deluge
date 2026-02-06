/**
 * searchfilter.js
 *
 * Copyright (C) 2026
 *
 * This file is part of Deluge and is licensed under GNU General Public License 3.0, or later, with
 * the additional special exception to link portions of this program with the OpenSSL library.
 * See LICENSE for more details.
 */

Ext.ns('Deluge.plugins');

Deluge.plugins.SearchFilterPlugin = Ext.extend(Deluge.Plugin, {
    name: 'SearchFilter',

    debounceMs: 250,

    constructor: function (config) {
        config = Ext.apply(
            {
                name: 'SearchFilter',
            },
            config
        );
        Deluge.plugins.SearchFilterPlugin.superclass.constructor.call(this, config);
    },

    onEnable: function () {
        this.searchText = '';
        this.previousSearchText = null;
        this.filterTask = new Ext.util.DelayedTask(this.onSearchDebounced, this);

        this.searchField = new Ext.form.TextField({
            emptyText: _('Filter by name...'),
            enableKeyEvents: true,
            listeners: {
                keyup: this.onSearchKeyUp,
                change: this.onSearchChange,
                scope: this,
            },
        });

        this.searchPanel = new Ext.Panel({
            title: _('Search'),
            layout: 'fit',
            border: false,
            autoHeight: true,
            filterType: 'search',
            getState: function () {
                return null;
            },
            listeners: {
                collapse: this.onSearchPanelCollapse,
                expand: this.onSearchPanelExpand,
                scope: this,
            },
            items: [this.searchField],
        });

        if (deluge.sidebar.items.getCount()) {
            deluge.sidebar.insert(0, this.searchPanel);
        } else {
            deluge.sidebar.add(this.searchPanel);
        }
        deluge.sidebar.doLayout();

        this.originalGetFilterStates = deluge.sidebar.getFilterStates;
        deluge.sidebar.getFilterStates = this.wrapGetFilterStates(
            this.originalGetFilterStates
        );

        deluge.sidebar.on('collapse', this.onSidebarCollapse, this);
        deluge.sidebar.on('expand', this.onSidebarExpand, this);

        this.originalUpdate = deluge.torrents.update;
        deluge.torrents.update = this.wrapTorrentUpdate(this.originalUpdate);
    },

    onDisable: function () {
        if (this.filterTask) {
            this.filterTask.cancel();
            this.filterTask = null;
        }

        this.searchText = '';
        this.previousSearchText = null;

        if (this.searchPanel && this.searchPanel.ownerCt) {
            this.searchPanel.ownerCt.remove(this.searchPanel, true);
            deluge.sidebar.doLayout();
        }
        this.searchPanel = null;
        this.searchField = null;

        if (this.originalGetFilterStates) {
            deluge.sidebar.getFilterStates = this.originalGetFilterStates;
            this.originalGetFilterStates = null;
        }

        deluge.sidebar.un('collapse', this.onSidebarCollapse, this);
        deluge.sidebar.un('expand', this.onSidebarExpand, this);

        if (this.originalUpdate) {
            deluge.torrents.update = this.originalUpdate;
            this.originalUpdate = null;
        }

        deluge.ui.update();
    },

    onSearchKeyUp: function (field) {
        this.filterTask.delay(this.debounceMs);
    },

    onSearchChange: function (field, value) {
        this.filterTask.delay(this.debounceMs);
    },

    onSearchDebounced: function () {
        var text = this.searchField ? this.searchField.getValue() : '';
        text = text || '';

        if (text == this.previousSearchText) {
            return;
        }

        this.searchText = text;
        this.previousSearchText = text;
        deluge.ui.update();
    },

    onSearchPanelCollapse: function () {
        this.previousSearchText = null;
        deluge.ui.update();
    },

    onSearchPanelExpand: function () {
        this.previousSearchText = null;
        deluge.ui.update();
    },

    onSidebarCollapse: function () {
        deluge.ui.update();
    },

    onSidebarExpand: function () {
        this.previousSearchText = null;
        deluge.ui.update();
    },

    isSearchVisible: function () {
        return (
            this.searchPanel &&
            !this.searchPanel.collapsed &&
            this.searchPanel.isVisible(true)
        );
    },

    isSearchActive: function () {
        return this.isSearchVisible() && !!this.searchText;
    },

    wrapTorrentUpdate: function (originalUpdate) {
        var plugin = this;
        return function (torrents, wipe) {
            if (!plugin.isSearchActive()) {
                originalUpdate.call(this, torrents, wipe);
                return;
            }

            var needle = plugin.searchText.toLowerCase();
            var filteredTorrents = {};

            for (var torrentId in torrents) {
                var torrent = torrents[torrentId];
                var name = (torrent.name || '').toLowerCase();
                if (name.indexOf(needle) > -1) {
                    filteredTorrents[torrentId] = torrent;
                }
            }

            originalUpdate.call(this, filteredTorrents, wipe);
        };
    },

    wrapGetFilterStates: function (originalGetFilterStates) {
        return function () {
            var states = originalGetFilterStates.call(this);
            if (states.search) {
                delete states.search;
            }

            if (!deluge.config.sidebar_multiple_filters && Ext.isObjectEmpty(states)) {
                var fallbackPanel = null;
                this.items.each(function (panel) {
                    if (fallbackPanel || panel.filterType == 'search') {
                        return;
                    }
                    if (panel.getState) {
                        fallbackPanel = panel;
                    }
                });

                if (fallbackPanel) {
                    var state = fallbackPanel.getState();
                    if (state != null) {
                        states[fallbackPanel.filterType] = state;
                    }
                }
            }

            return states;
        };
    },
});

Deluge.registerPlugin('SearchFilter', Deluge.plugins.SearchFilterPlugin);
