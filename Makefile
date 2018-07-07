################################################################################
#                                                                              #
#     This file is part of Kokopu, a JavaScript chess library.                 #
#     Copyright (C) 2018  Yoann Le Montagner <yo35 -at- melix.net>             #
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
SRC_FILES         = index.js $(shell find src)
SRC_DEV_FILES     = $(shell find demo) $(shell find test)
SRC_DOC_FILES     = $(shell find doc_src)
DOC_CONFIG_FILE   = .jsdoc.json

# Generated files and folders
NODE_MODULES_DIR    = node_modules
DOCUMENTATION_DIR   = docs
DISTRIBUTION_DIR    = dist
BROWSER_JS_FILE     = dist/kokopu.js
BROWSER_MIN_JS_FILE = dist/kokopu.min.js

# Various commands
ECHO          = echo
JSDOC         = ./node_modules/.bin/jsdoc
BROWSERIFY    = ./node_modules/.bin/browserify
UGLIFYJS      = ./node_modules/.bin/uglifyjs
COLOR_IN      = \033[34;1m
COLOR_OUT     = \033[0m
COLOR_ITEM_IN = \033[35;1m
COLOR_ITEM_OUT= \033[0m



# Help notice
# -----------

all: help

help:
	@$(ECHO)
	@$(ECHO) "$(COLOR_IN)Available commands:$(COLOR_OUT)"
	@$(ECHO) " * make $(COLOR_ITEM_IN)init$(COLOR_ITEM_OUT): initialize the repository for development."
	@$(ECHO) " * make $(COLOR_ITEM_IN)lint$(COLOR_ITEM_OUT): run the static analysis tool."
	@$(ECHO) " * make $(COLOR_ITEM_IN)unit$(COLOR_ITEM_OUT): run the unit tests."
	@$(ECHO) " * make $(COLOR_ITEM_IN)test$(COLOR_ITEM_OUT): run the whole test and validation suit."
	@$(ECHO) " * make $(COLOR_ITEM_IN)clean$(COLOR_ITEM_OUT): remove the automatically generated files."
	@$(ECHO) " * make $(COLOR_ITEM_IN)help$(COLOR_ITEM_OUT): show this help."
	@$(ECHO)



# Initialization
# --------------

init: $(NODE_MODULES_DIR)

$(NODE_MODULES_DIR): $(PACKAGE_JSON_FILE)
	@$(ECHO) "$(COLOR_IN)Installing NPM modules...$(COLOR_OUT)"
	@npm install



# Generate the documentation
# --------------------------

$(DOCUMENTATION_DIR): $(DOC_CONFIG_FILE) $(SRC_FILES) $(SRC_DOC_FILES) $(PACKAGE_JSON_FILE) $(NODE_MODULES_DIR)
	@$(ECHO) "$(COLOR_IN)Building documentation...$(COLOR_OUT)"
	@rm -rf $@
	@$(JSDOC) -c $< -d $@



# Generate the distributed files
# ------------------------------

$(BROWSER_JS_FILE): $(SRC_FILES) $(NODE_MODULES_DIR)
	@$(ECHO) "$(COLOR_IN)Generating kokopu.js...$(COLOR_OUT)"
	@mkdir -p $(DISTRIBUTION_DIR)
	@$(BROWSERIFY) -s kokopu -o $@ $<

$(BROWSER_MIN_JS_FILE): $(BROWSER_JS_FILE) $(NODE_MODULES_DIR)
	@$(ECHO) "$(COLOR_IN)Minifying kokopu.js...$(COLOR_OUT)"
	@mkdir -p $(DISTRIBUTION_DIR)
	@$(UGLIFYJS) -o $@ $<



# Testing and validation
# ----------------------

test: lint unit

lint:
	@$(ECHO) "$(COLOR_IN)Running static analysis...$(COLOR_OUT)"
	@npm run lint

unit:
	@$(ECHO) "$(COLOR_IN)Running unit tests...$(COLOR_OUT)"
	@npm run unit



# Cleaning & Make's stuff 
# -----------------------

clean:
	@rm -rf $(NODE_MODULES_DIR) npm-debug.log $(DOCUMENTATION_DIR) $(DISTRIBUTION_DIR)

.PHONY: help init lint unit test clean
