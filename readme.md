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
credentials. Example of configuration:

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
  -c, --config      provide path to config file             [string] [required]
  -t, --type        provide ebook type [pdf|epub|mobi]         [default: "pdf"]
  -d, --directory   provide path to destination directory              [string]
  -o, --use-stdout  print contents to stanard output           [default: false]
  -h, --help        Show help                                         [boolean]
```
