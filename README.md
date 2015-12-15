# prinspector

## _IMPORTANT! Requires Node.js 4.2.1 or higher_

### 1. Clone the repository

```
$ git clone https://github.com/programbo/prinspector
```

### 2. Install dependencies

```
$ cd prinspector
$ npm i
```

### 3. View your open PRs (raw JSON)

```
$ node prinspector.js
  Sign in to authorize this app to find open pull-requests
  Github username (<default@github_user>)
  Github password
```

### What else can _prinspector_ do?

```
$ node prinspector.js -h

  Usage: prinspector [options]

  Options:

    -h, --help       output usage information
    -V, --version    output the version number
    -d, --debug      Run in debug mode
    -l, --limit <n>  Limit the maximum number of repositories
    -p, --pretty     Pretty output
```

### Using `prinspector` in middleware

Just require `prinspector`. See `/index.js` for config parameters.
