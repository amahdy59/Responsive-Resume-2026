# Run after build-resume-documents.py on Windows with Microsoft Word installed.
# Export from Word so the PDF and editable document share pagination and links.
$ErrorActionPreference = 'Stop'
$resumeRoot = Split-Path $PSScriptRoot -Parent
$resumeDocx = Join-Path $resumeRoot 'output/documents/ahmed-mahdy-resume.docx'
$resumePdfDirectory = Join-Path $resumeRoot 'output/pdf'
New-Item -ItemType Directory -Force -Path $resumePdfDirectory | Out-Null
$resumePdf = Join-Path $resumePdfDirectory 'ahmed-mahdy-resume.pdf'
$resumeWord = New-Object -ComObject Word.Application
$resumeWord.Visible = $false
$resumeDocument = $null
try {
    $resumeDocument = $resumeWord.Documents.Open($resumeDocx, $false, $false)
    $resumeDocument.Repaginate()
    foreach ($story in $resumeDocument.StoryRanges) {
        $range = $story
        while ($null -ne $range) {
            $range.Fields.Update() | Out-Null
            $range = $range.NextStoryRange
        }
    }
    $resumeDocument.Save()
    $resumeDocument.ExportAsFixedFormat($resumePdf, 17, $false, 0, 0, 1, 999, 0, $true, $true, 1, $true, $true, $false)
} finally {
    if ($null -ne $resumeDocument) { $resumeDocument.Close($false) }
    $resumeWord.Quit()
}
Copy-Item -LiteralPath $resumeDocx -Destination (Join-Path $resumeRoot 'assets/documents/ahmed-mahdy-resume.docx') -Force
Copy-Item -LiteralPath $resumePdf -Destination (Join-Path $resumeRoot 'assets/documents/ahmed-mahdy-resume.pdf') -Force
Write-Output $resumePdf
