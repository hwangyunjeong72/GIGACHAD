# Read-only Windows observations for the local GIGACHAD dashboard.
# No elevation, changes to firewall/policy, remote targets, or event-message export.
[CmdletBinding()]
param([Parameter(Mandatory=$true)][ValidateSet('network','firewall','System','Application')][string]$Section)

$ErrorActionPreference = 'Stop'
[Console]::OutputEncoding = [System.Text.UTF8Encoding]::new($false)

function Iso([datetime]$value) { return $value.ToUniversalTime().ToString('yyyy-MM-ddTHH:mm:ss.fffZ') }
function Failure([string]$reason) {
  return [ordered]@{ status = 'unavailable'; measuredAt = $null; reason = $reason }
}
function SafeReason($failure) {
  $message = [string]$failure.Exception.Message
  $errorId = [string]$failure.FullyQualifiedErrorId
  if ($failure.Exception -is [System.UnauthorizedAccessException] -or
      $message -match 'access is denied|permission denied|unauthorized|access denied|accesso negado|access refused|\uAC70\uBD80|\uAD8C\uD55C' -or
      $errorId -match 'AccessDenied|PermissionDenied|Unauthorized') { return 'ACCESS_DENIED' }
  if ($errorId -match 'CommandNotFound' -or $failure.Exception -is [System.Management.Automation.CommandNotFoundException]) { return 'COMMAND_UNAVAILABLE' }
  return 'QUERY_FAILED'
}

try {
  $result = $null
  if ($Section -eq 'network') {
    $adapters = @(Get-NetAdapter -ErrorAction Stop | Sort-Object -Property Name)
    $configuration = @(Get-NetIPConfiguration -All -ErrorAction Stop)
    $rows = @()
    foreach ($adapter in @($adapters | Select-Object -First 32)) {
      $match = @($configuration | Where-Object { $_.InterfaceIndex -eq $adapter.ifIndex })
      $ip = @($match | ForEach-Object { $_.IPv4Address } | Where-Object { $null -ne $_ } | ForEach-Object { [string]$_.IPAddress } | Where-Object { $_ })
      $gateway = @($match | ForEach-Object { $_.IPv4DefaultGateway } | Where-Object { $null -ne $_ } | ForEach-Object { [string]$_.NextHop } | Where-Object { $_ })
      $rows += [ordered]@{ name = [string]$adapter.Name; status = [string]$adapter.Status; ipv4 = $ip; gateway = $gateway }
    }
    $result = [ordered]@{
      status = 'measured'; measuredAt = Iso (Get-Date); unit = 'adapters'
      adapterCount = $adapters.Count; truncated = ($adapters.Count -gt 32); adapters = $rows
    }
  } elseif ($Section -eq 'firewall') {
    $profiles = @(Get-NetFirewallProfile -PolicyStore ActiveStore -ErrorAction Stop | Sort-Object -Property Name)
    $rows = @()
    foreach ($profile in $profiles) {
      $rows += [ordered]@{
        name = [string]$profile.Name; enabled = [bool]$profile.Enabled
        inbound = [string]$profile.DefaultInboundAction; outbound = [string]$profile.DefaultOutboundAction
      }
    }
    $result = [ordered]@{ status = 'measured'; measuredAt = Iso (Get-Date); profiles = $rows }
  } else {
    # Confirm that the log is readable before treating 'no matching events' as zero.
    $log = Get-WinEvent -ListLog $Section -ErrorAction Stop
    if ($null -eq $log -or -not $log.IsEnabled) { throw [System.Exception]::new('LOG_UNAVAILABLE') }
    $end = Get-Date
    $start = $end.AddHours(-24)
    $errorCount = 0
    $warningCount = 0
    try {
      Get-WinEvent -FilterHashtable @{ LogName=$Section; Level=@(2,3); StartTime=$start; EndTime=$end } -ErrorAction Stop |
        ForEach-Object { if ($_.Level -eq 2) { $errorCount++ } elseif ($_.Level -eq 3) { $warningCount++ } }
    } catch {
      if ([string]$_.FullyQualifiedErrorId -notmatch '^NoMatchingEventsFound') { throw }
    }
    $result = [ordered]@{
      status = 'measured'; measuredAt = Iso (Get-Date); log = $Section
      windowStart = Iso $start; windowEnd = Iso $end
      unit = 'events'; errorCount = $errorCount; warningCount = $warningCount
    }
  }
} catch {
  $reason = SafeReason $_
  if ([string]$_.Exception.Message -eq 'LOG_UNAVAILABLE') { $reason = 'LOG_UNAVAILABLE' }
  $result = Failure $reason
}

$result | ConvertTo-Json -Depth 6 -Compress
