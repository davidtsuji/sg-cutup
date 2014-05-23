build:
	@npm install
	@./node_modules/.bin/bower install --config.interactive=false
	@./node_modules/.bin/gulp

clean:
	@rm -rf node_modules bower_components public dist .tmp

release:
	@make clean
	@make build

.PHONY: build clean release
