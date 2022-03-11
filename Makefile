DIR := ${CURDIR}
FUNCTIONS = $(shell ls functions)
WORK_FUNCTIONS = request-otp authorize-otp hasura-auth-webhook

NPM_TOKEN := $(shell echo ${NPM_TOKEN})

PURPLE 		:= $(shell tput setaf 129)
GRAY  		:= $(shell tput setaf 245)
GREEN  		:= $(shell tput setaf 34)
BLUE 		:= $(shell tput setaf 25)
YELLOW 		:= $(shell tput setaf 3)
WHITE  		:= $(shell tput setaf 7)
RESET  		:= $(shell tput sgr0)

.PHONY: help h
.DEFAULT_GOAL := help

help:

	@echo Stack Targets:
	@echo
	@awk '/^[a-zA-Z\/\-\_0-9]+:/ { \
		helpMessage = match(lastLine, /^## (.*)/); \
		if (helpMessage) { \
			helpCommand = substr($$1, 0, index($$1, ":")-1); \
			helpMessage = substr(lastLine, RSTART + 3, RLENGTH); \
			printf "  ${GREEN}%-10s${RESET} ${GRAY}%s${RESET}\n", helpCommand, helpMessage; \
		} \
	} \
	{ lastLine = $$0 }' $(MAKEFILE_LIST)
	@echo
	@echo Function Targets:
	@echo
	@awk '/^[a-zA-Z\/\-\_0-9]+:/ { \
		helpMessage = match(lastLine, /^### (.*)/); \
		if (helpMessage) { \
			helpCommand = substr($$1, 0, index($$1, ":")-1); \
			helpMessage = substr(lastLine, RSTART + 3, RLENGTH); \
			printf "  ${GREEN}%-30s${RESET} ${GRAY}%s${RESET}\n", helpCommand, helpMessage; \
		} \
	} \
	{ lastLine = $$0 }' $(MAKEFILE_LIST)
	@echo
	@echo Hasura Targets:
	@echo
	@awk '/^[a-zA-Z\/\-\_0-9]+:/ { \
		helpMessage = match(lastLine, /^#### (.*)/); \
		if (helpMessage) { \
			helpCommand = substr($$1, 0, index($$1, ":")-1); \
			helpMessage = substr(lastLine, RSTART + 4, RLENGTH); \
			printf "  ${GREEN}%-30s${RESET} ${GRAY}%s${RESET}\n", helpCommand, helpMessage; \
		} \
	} \
	{ lastLine = $$0 }' $(MAKEFILE_LIST)
	@echo


guard-%:
	@ if [ "${${*}}" = "" ]; then \
		echo "Environment variable $* not set (make $*=.. target or export $*=.."; \
		exit 1; \
	fi

setup: stack/faas/install env/clone node/install/all stack/all/buildrestart

coreup: stack/infra/up stack/corefunctions/up

work: stack/infra/up stack/functions/up

leave: stack/infra/down stack/functions/down

## Install infrastructure
stack/infra/install:
	@echo "Installing Hasura CLI..."
	@curl -L https://github.com/hasura/graphql-engine/raw/stable/cli/get.sh | bash
	@echo "Installing Arkade CLI..."
	@curl -SLsf https://dl.get-arkade.dev/ | bash
	@echo "Installing Openfaas..."
	@arkade install openfaas
	@echo "Installing Openfaas CLI..."
	@curl -sSL https://cli.openfaas.com | bash && arkade install openfaas

## Install only FAAS for infrastructure
stack/faas/install:
	@echo "Installing Hasura CLI..."
	@curl -L https://github.com/hasura/graphql-engine/raw/stable/cli/get.sh | bash
	@echo "Installing Openfaas CLI..."
	@curl -sSL https://cli.openfaas.com | bash

## Start infrastructure
stack/infra/start: stack/rollout/deployment stack/infra/portforward stack/infra/login stack/infra/up

## Creates the docker network (checks if it exists first).
stack/network/create:

	@docker network inspect h08_network > /dev/null || docker network create --ipam-driver default --subnet=10.0.0.0/16 --attachable h08_network

## Destroys and re-creates the docker network.
stack/network/recreate:

	@echo "Re-creating docker network.."

	#
	# Test if network exists, if so delete it.
	#
	@docker network inspect h08_network && docker network rm h08_network

	#
	# Create the network
	#
	@docker network create --ipam-driver default --subnet=99.0.0.0/16 --attachable h08_network

## Bring only the infrastructure containers UP
stack/infra/up: stack/network/create

	@echo "Bringing infrastructure containers up..."
	@docker-compose -f docker-compose.yml up -d

	@$(MAKE) stack/status

stack/infra/purge:
	@echo "Removing all containers and images..."
	@docker rm -f $(shell docker ps | grep "h08-" | awk '{print $$1}')
	@docker rmi -f $(shell docker images | grep "localhost:5000/h08-" | awk "{print \$$3}")
	@docker rmi -f $(shell docker images | grep "<none>" | awk "{print \$$3}")

## Bring only the infrastructure containers DOWN (does not touch the module services).
stack/infra/down:

	@echo "Bringing infrastructure containers down..."
	@docker-compose -f docker-compose.yml down

	@$(MAKE) stack/status

## Restart only the infrastructure containers.
stack/infra/restart: stack/infra/down stack/infra/up

	@osascript -e 'display notification "complete" with title "stack/infra/restart" sound name "default"'

## Re-builds and re-starts ALL functions including infrastructure services.
stack/all/buildrestart: stack/infra/restart stack/functions/down stack/functions/buildup

## Bring only the infrastructure containers DOWN (does not touch the module services) + DELETE data volumes.
stack/infra/downdeletevolumes:

	@echo "Bringing infrastructure containers down..."
	@docker-compose -f docker-compose.yaml down -v

## Remove node_modules across all functions.
node/remove/all:
	@echo "Removing npm packages from all modules..."
	@for F in $(WORK_FUNCTIONS); do cd $(DIR)/functions/$$F && [ -d node_modules ] && echo "Removing npm packages for $$F..." && rm -rf node_modules; done
	@echo "Finished removing npm packages"

## Install node_modules across all functions.
node/install/all:
	@echo "Installing npm packages for all modules..."
	@for F in $(WORK_FUNCTIONS); do cd $(DIR)/functions/$$F && [ -f package.json ] && echo "Installing npm packages for $$F..." && npm install; done
	@echo "Finished installing npm packages"

## Install a specific node module with @latest (requires PACKAGE p) across all functions
node/install/package: guard-p
	@echo "Installing npm package $(p) for all modules..."
	@for F in $(WORK_FUNCTIONS); do cd $(DIR)/functions/$$F && [ -f package.json ] && npm install $(p); done
	cd $(DIR)/functions/template/node-typescript && npm install $(p)
	@echo "Finished installing npm package $(p)"

## Uninstall a specific node module with @latest (requires PACKAGE p) across all functions
node/uninstall/package: guard-p
	@echo "Uninstalling npm package $(p) for all modules..."
	@for F in $(WORK_FUNCTIONS); do cd $(DIR)/functions/$$F && [ -f package.json ] && npm uninstall $(p); done
	@echo "Finished uninstalling npm package $(p)"

## Rollout deployment
stack/rollout/deployment:
	@kubectl rollout status -n openfaas deploy/gateway

## add cloud connections
stack/infra/portforward:
	@kubectl port-forward -n openfaas svc/gateway 8080:8080 &

## Stores basic auth credentials for OpenFaaS gateway (supports multiple gateways)
stack/infra/login:
	$(eval PASSWORD := $(shell kubectl get secret -n openfaas basic-auth -o jsonpath="{.data.basic-auth-password}" | base64 --decode; echo))
	@echo $(PASSWORD)
	@faas-cli login --username admin --password $(PASSWORD)

## Clone env file
env/clone:
	@cp .env.example .env

## Displays the output of docker.
stack/status:

	@echo "${BLUE}########################################################################################################################${RESET}"
	@echo "${GREEN}CURRENT CONTAINER STATUS:${RESET}"
	@echo "----"
	@docker ps -a --format '{{.Names}};{{.Status}};{{.Ports}}' | grep h08 | column -s";" -t
	@echo "----"
	@echo "TOTAL: ${GREEN}$(shell docker ps -a | grep h08 | wc -l)${RESET}"
	@echo "${BLUE}########################################################################################################################${RESET}"

### Build all functions
stack/functions/build:
	@cd $(DIR)/functions && for F in $(WORK_FUNCTIONS); do cp $$F/.env.example $$F/.env && faas-cli build -f $$F.yml --build-arg NPM_TOKEN=$(NPM_TOKEN) --no-cache; done

### Build all functions using CI yaml files
stack/functions/buildci:
	@cd $(DIR)/functions && for F in $(WORK_FUNCTIONS); do cp $$F/.env.example $$F/.env && faas-cli build -f $$F.ci.yml --build-arg NPM_TOKEN=$(NPM_TOKEN) --no-cache; done

### Bring only the functions DOWN (not the main dependencies like postgres, elasticsearch, etc).
stack/functions/down:

	@echo "Bringing modules down.."
	@for F in $(WORK_FUNCTIONS); do echo "bringing down $$F.."; cd $(DIR)/functions/$$F && [ -f docker-compose.yml ] && docker-compose down; done

### Bring only the functions UP (not the main dependencies like postgres, graphql-engine, etc).
stack/functions/up:
	@echo "Spinning up modules.."
	@for F in $(WORK_FUNCTIONS); do echo "spinning up $$F.."; cd $(DIR)/functions/$$F && [ -f docker-compose.yml ] && docker-compose up -d; done

### Restart all functions
stack/functions/restart: stack/functions/down stack/functions/up

### Build and start all containers
stack/functions/buildup: stack/functions/build stack/functions/up
	@$(MAKE) stack/status
	@osascript -e 'display notification "complete" with title "stack/modules/buildrestart" sound name "default"'

#### Run migration, seeder and apply metadata
stack/hasura/install: stack/hasura/migrate stack/hasura/metadata

#### Hasura run migration and seeding
stack/hasura/migrate:
	@cd $(DIR)/hasura && hasura migrate apply && hasura seeds apply

#### Hasura run migration and seeding
stack/hasura/metadata:
	@cd $(DIR)/hasura && hasura metadata apply

