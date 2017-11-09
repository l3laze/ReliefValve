// Read a null-terminated UTF-8 string from a Buffer, returning the string and
// the number of bytes read
function readStr(buf) {
  let size = 0

  while (buf.readUInt8(size++) != 0x00) continue

  let str = buf.toString('utf8', 0, size - 1)

  return [str, size]
}

// Read header and app entries from binary VDF Buffer
function readAppInfo( data ) {
  var buf = Buffer.from( data, "binary" );
  // First byte varies across installs, only the 2nd and 3rd seem consistent
  if (buf.readUInt8(1) != 0x44 || buf.readUInt8(2) != 0x56)
    throw new Error('Invalid file signature')

  return readAppEntries(buf.slice(8))
}

// Read a collection of app entries
function readAppEntries(buf) {
  const entries = []

  // App entry collection is terminated by null dword
  for (let off = 0; buf.readUInt32LE(off) != 0x00000000; ++off) {
    let [entry, size] = readAppEntry(buf.slice(off))

    entries.push(entry)

    off += size
  }

  return entries
}

// Read a single app entry, returning its id, name and key-value entries
function readAppEntry(buf) {
  let off = 0

  const id = buf.readUInt32LE(off)

  off += 49 // Skip a bunch of fields we don't care about

  const [name, nameSize] = readStr(buf.slice(off))

  off += nameSize

  const [entries, entriesSize] = readEntries(buf.slice(off))

  off += entriesSize

  return [{id, name, entries}, off]
}

// Read a collection of key-value entries, returning the collection and bytes
// read
function readEntries(buf) {
  const entries = {}

  let off = 0

  // Entry collection is terminated by 0x08 byte
  for (; buf.readUInt8(off) != 0x08;) {
    let [key, val, size] = readEntry(buf.slice(off))

    entries[key] = val

    off += size
  }

  return [entries, off + 1]
}

// Read a single entry, returning the key-value pair and bytes read
function readEntry(buf) {
  let off = 0

  let type = buf.readUInt8(off)

  off += 1

  let [key, keySize] = readStr(buf.slice(off))

  off += keySize

  switch (type) {
    case 0x00: // Nested entries
      let [kvs, kvsSize] = readEntries(buf.slice(off))

      return [key, kvs, off + kvsSize]

    case 0x01: // String
      let [str, strSize] = readStr(buf.slice(off))

      return [key, str, off + strSize]

    case 0x02: // Int
      return [key, buf.readUInt32LE(off), off + 4]

    default:
      throw new Error(`Unhandled entry type: ${type}`)
  }
}

module.exports = {
  readAppInfo: data => readAppInfo( data ),
}
