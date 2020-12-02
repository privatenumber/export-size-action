<p align='center'>
  <img src='https://avatars0.githubusercontent.com/u/44036562?s=200&v=4' width='100'>
</p>

<h1 align='center'>export-size-action</h1>

<p align='center'>
  GitHub Actions for <a href='https://github.com/antfu/export-size'>export-size</a>, similar to <a href='https://github.com/andresz1/size-limit-action'>size-limit-action</a> but for <b>each single export</b>.
</p>

<br>

![image](https://user-images.githubusercontent.com/11247099/98110849-b1d28600-1eda-11eb-9fae-c0ed2216f5b1.png)

## Usage

Add the following action inside `.github/workflows/export-size.yml`

```yaml
name: Export Size
on:
  pull_request:
    branches: [master, develop, OTHER_BRANCHES]

jobs:
  size:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: antfu/export-size-action@v1
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

#### Monorepo

```yaml
  - uses: antfu/export-size-action@v1
    env:
      GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
    with:
      paths: package/core,package/foo
```

### Options

#### Environment variables
- `GITHUB_TOKEN`* - The GitHub token to access the repo with. You should pass in `secrets.GITHUB_TOKEN`
- `COMMENTER_TOKEN` - The GitHub token to post the size-report comment with. If this is unspecified, the comment is made by @github-actions.
