; Undanu for Windows - per-user installer (no admin rights). build.py compiles it with:
;   iscc /DAppVersion=1.0.0 /DSourceDir=<dist\Undanu> /DOutputDir=<dist> /DIconFile=<build\undanu.ico> undanu.iss
; Installs to %LOCALAPPDATA%\Programs\Undanu, adds Undanu to the Start menu (and optionally the desktop) and lists it
; in Settings > Apps. The window keeps its data (what you saved in it) in %LOCALAPPDATA%\Undanu, which
; uninstalling leaves in place so a reinstall finds it again.

#ifndef AppVersion
  #define AppVersion "1.0.0"
#endif
#ifndef SourceDir
  #define SourceDir "dist\Undanu"
#endif
#ifndef OutputDir
  #define OutputDir "dist"
#endif
#ifndef IconFile
  #define IconFile "build\undanu.ico"
#endif

[Setup]
AppId={{E81247BA-698B-569E-A6DE-E1E1C366EEFB}
AppName=Undanu
AppVersion={#AppVersion}
AppVerName=Undanu {#AppVersion}
AppPublisher=Juwen Lie
AppPublisherURL=https://juw12.github.io/undanu/
AppSupportURL=https://github.com/juw12/undanu
DefaultDirName={autopf}\Undanu
DisableDirPage=yes
DisableProgramGroupPage=yes
PrivilegesRequired=lowest
OutputDir={#OutputDir}
OutputBaseFilename=Undanu-Windows-Setup
SetupIconFile={#IconFile}
UninstallDisplayIcon={app}\Undanu.exe
UninstallDisplayName=Undanu
Compression=lzma2
SolidCompression=yes
WizardStyle=modern
ArchitecturesAllowed=x64compatible
ArchitecturesInstallIn64BitMode=x64compatible
CloseApplications=no
SetupLogging=yes

[Languages]
Name: "english"; MessagesFile: "compiler:Default.isl"

[Tasks]
Name: "desktopicon"; Description: "{cm:CreateDesktopIcon}"; GroupDescription: "{cm:AdditionalIcons}"

[Files]
Source: "{#SourceDir}\*"; DestDir: "{app}"; Flags: ignoreversion recursesubdirs createallsubdirs

[Icons]
Name: "{userprograms}\Undanu"; Filename: "{app}\Undanu.exe"; Comment: "Digital wedding invitations with a personal link for each guest"
Name: "{userdesktop}\Undanu"; Filename: "{app}\Undanu.exe"; Comment: "Digital wedding invitations with a personal link for each guest"; Tasks: desktopicon

[Run]
Filename: "{app}\Undanu.exe"; Description: "{cm:LaunchProgram,Undanu}"; Flags: nowait postinstall skipifsilent

[UninstallRun]
Filename: "{app}\Undanu.exe"; Parameters: "--stop"; Flags: runhidden waituntilterminated; RunOnceId: "StopUndanu"

[Code]
function PrepareToInstall(var NeedsRestart: Boolean): String;
var
  ResultCode: Integer;
begin
  Result := '';
  { Updating: close an open Undanu window first so its files can be replaced. }
  if FileExists(ExpandConstant('{app}\Undanu.exe')) then
    Exec(ExpandConstant('{app}\Undanu.exe'), '--stop', '', SW_HIDE, ewWaitUntilTerminated, ResultCode);
end;
