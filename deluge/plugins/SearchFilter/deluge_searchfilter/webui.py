#
# Copyright (C) 2026
#
# This file is part of Deluge and is licensed under GNU General Public License 3.0, or later, with
# the additional special exception to link portions of this program with the OpenSSL library.
# See LICENSE for more details.
#

from deluge.plugins.pluginbase import WebPluginBase

from .common import get_resource


class WebUI(WebPluginBase):
    scripts = [get_resource('searchfilter.js')]
    debug_scripts = scripts
