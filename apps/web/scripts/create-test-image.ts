import path from 'path'
import fs from 'fs'

const filePath = path.resolve('tests/fixtures/test.png')

fs.mkdirSync(path.dirname(filePath), { recursive: true })

fs.writeFileSync(
  filePath,
  Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO7WqVQAAAAASUVORK5CYII=',
    'base64'
  )
)