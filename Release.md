# Release

## Before release

  run npm test
  increases version on package.json
  run npm install (check vulnerabilities)
  edit changelog
  commit and push to repo

## Releasing

	launch release on git:
		>> gh release create ${tag}

  npm publish
