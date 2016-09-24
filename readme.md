PacktPub free ebooks downloader
===============================

This utility downloads free ebook offered daily from packtpub.com
publishing service.

## Installation

```bash    
npm install -g vladimyr/packtpub-downloader
```

## Configuration

PacktPub downloader uses JSON configuration for retrieving login 
credentials. Configuration can be permanently stored at `~/.config/packtpub-downloader/config.json` or provided through runtime flag. Example of configuration:

```json
{
  "username": "{{ put your username here }}",
  "password": "{{ put your password here }}"
}        
```


## How to use

Invoke inside your terminal with provided path to configuration file.
Optionally you can force specific download type, provide destination directory
or even dump ebook contents output to stdout for further piping:

```bash
packtpub-download -c [config file] -t <type> -d <download dir>

Options:
  --version         Show version number                               [boolean]
  -c, --config      Provide path to config file                        [string]
  -t, --type        Provide ebook type
                     [string] [choices: "pdf", "epub", "mobi"] [default: "pdf"]
  -d, --directory   Provide path to destination directory              [string]
  -o, --use-stdout  Print contents to stanard output           [default: false]
  -h, --help        Show help                                         [boolean]
```
