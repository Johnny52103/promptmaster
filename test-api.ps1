$body = '{"rawInput":"a warrior in a forest"}'
try {
  $r = Invoke-WebRequest -Uri 'https://promptmaster-hazel.vercel.app/api/optimize' -Method Post -Body $body -ContentType 'application/json'
  Write-Output $r.Content
} catch {
  $stream = $_.Exception.Response.GetResponseStream()
  $reader = New-Object System.IO.StreamReader($stream)
  $err = $reader.ReadToEnd()
  $reader.Close()
  Write-Output $err
}
