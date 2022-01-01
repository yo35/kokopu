################################################################################
#                                                                              #
#     This file is part of Kokopu, a JavaScript chess library.                 #
#     Copyright (C) 2018-2022  Yoann Le Montagner <yo35 -at- melix.net>        #
#                                                                              #
#     This program is free software: you can redistribute it and/or            #
#     modify it under the terms of the GNU Lesser General Public License       #
#     as published by the Free Software Foundation, either version 3 of        #
#     the License, or (at your option) any later version.                      #
#                                                                              #
#     This program is distributed in the hope that it will be useful,          #
#     but WITHOUT ANY WARRANTY; without even the implied warranty of           #
#     MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the             #
#     GNU Lesser General Public License for more details.                      #
#                                                                              #
#     You should have received a copy of the GNU Lesser General                #
#     Public License along with this program. If not, see                      #
#     <http://www.gnu.org/licenses/>.                                          #
#                                                                              #
################################################################################


# Source files and folders
PACKAGE_JSON_FILE = package.json
SRC_MAIN_FILE     = src/index.js
SRC_FILES         = $(shell find src -type f)
SRC_DOC_FILES     = $(shell find doc_src -type f)
DOC_CONFIG_FILE   = scripts/jsdoc.json
INFO_FILES        = README.md CHANGELOG.md LICENSE

# Kokopu information
PACKAGE_AUTHOR  = $(shell node -p 'require("./$(PACKAGE_JSON_FILE)").author')
PACKAGE_LICENSE = $(shell node -p 'require("./$(PACKAGE_JSON_FILE)").license')
PACKAGE_VERSION = $(shell node -p 'require("./$(PACKAGE_JSON_FILE)").version')

# Generated files and folders
BUILD_DIR            = build
DIST_DIR             = dist
BROWSER_JS_FILE      = $(BUILD_DIR)/kokopu.js
BROWSER_MIN_JS_FILE  = $(BUILD_DIR)/kokopu.min.js
BROWSER_ARCHIVE_FILE = $(DIST_DIR)/kokopu-$(PACKAGE_VERSION).zip
DOCUMENTATION_DIR    = $(DIST_DIR)/docs

# Commands
ECHO = echo


# Node's stuff & cleaning
# -----------------------

.PHONY: clean

all: $(BROWSER_ARCHIVE_FILE) $(DOCUMENTATION_DIR)

clean:
	@rm -rf $(BUILD_DIR) $(DIST_DIR)


# Build targets
# -------------

$(BROWSER_ARCHIVE_FILE): $(BROWSER_JS_FILE) $(BROWSER_MIN_JS_FILE) $(INFO_FILES)
	@$(ECHO) "Generate kokopu-$(PACKAGE_VERSION).zip..."
	@mkdir -p $(DIST_DIR)
	@rm -f $@
	@zip -jq $@ $^

$(BROWSER_JS_FILE): $(SRC_MAIN_FILE) $(SRC_FILES) $(PACKAGE_JSON_FILE)
	@$(ECHO) "Generate kokopu.js..."
	@mkdir -p $(BUILD_DIR)
	@echo '/**' > $@
	@echo ' * kokopu (https://www.npmjs.com/package/kokopu)' >> $@
	@echo ' * @version $(PACKAGE_VERSION)' >> $@
	@echo ' * @author $(PACKAGE_AUTHOR)' >> $@
	@echo ' * @license $(PACKAGE_LICENSE)' >> $@
	@echo ' */' >> $@
	@npx browserify --standalone kokopu $< >> $@

$(BROWSER_MIN_JS_FILE): $(BROWSER_JS_FILE) $(PACKAGE_JSON_FILE)
	@$(ECHO) "Minify kokopu.js..."
	@mkdir -p $(BUILD_DIR)
	@npx uglifyjs --comments --compress -o $@ $<

$(DOCUMENTATION_DIR): $(DOC_CONFIG_FILE) $(SRC_FILES) $(SRC_DOC_FILES) $(PACKAGE_JSON_FILE)
	@$(ECHO) "Generate documentation..."
	@mkdir -p $(DIST_DIR)
	@rm -rf $@
	@npx jsdoc --configure $< --destination $@
