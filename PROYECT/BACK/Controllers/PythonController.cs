using Microsoft.AspNetCore.Mvc;
using System.Diagnostics;
using System.Text;

namespace BACK.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class PythonController : ControllerBase
    {
        [HttpPost("execute")]
        public async Task<IActionResult> ExecutePython([FromBody] PythonExecuteRequest request)
        {
            if (request == null || string.IsNullOrWhiteSpace(request.Code))
            {
                return BadRequest(new { message = "El código Python es requerido" });
            }

            try
            {
                var output = new StringBuilder();
                var error = new StringBuilder();

                // Try python3 first (Linux/Mac), then python (Windows)
                string pythonCommand = "python3";
                try
                {
                    var testProcess = new Process
                    {
                        StartInfo = new ProcessStartInfo
                        {
                            FileName = pythonCommand,
                            Arguments = "--version",
                            RedirectStandardOutput = true,
                            RedirectStandardError = true,
                            UseShellExecute = false,
                            CreateNoWindow = true
                        }
                    };
                    testProcess.Start();
                    testProcess.WaitForExit(1000);
                    if (testProcess.ExitCode != 0)
                    {
                        pythonCommand = "python";
                    }
                }
                catch
                {
                    pythonCommand = "python";
                }

                // Create a temporary file to store the Python code
                var tempFile = Path.Combine(Path.GetTempPath(), $"python_exec_{Guid.NewGuid()}.py");
                await System.IO.File.WriteAllTextAsync(tempFile, request.Code, Encoding.UTF8);

                try
                {
                    var processStartInfo = new ProcessStartInfo
                    {
                        FileName = pythonCommand,
                        Arguments = $"\"{tempFile}\"",
                        RedirectStandardOutput = true,
                        RedirectStandardError = true,
                        UseShellExecute = false,
                        CreateNoWindow = true,
                        StandardOutputEncoding = Encoding.UTF8,
                        StandardErrorEncoding = Encoding.UTF8
                    };

                    using (var process = new Process())
                    {
                        process.StartInfo = processStartInfo;
                        
                        // Set up output handlers
                        process.OutputDataReceived += (sender, e) =>
                        {
                            if (!string.IsNullOrEmpty(e.Data))
                            {
                                output.AppendLine(e.Data);
                            }
                        };

                        process.ErrorDataReceived += (sender, e) =>
                        {
                            if (!string.IsNullOrEmpty(e.Data))
                            {
                                error.AppendLine(e.Data);
                            }
                        };

                        process.Start();

                        // Begin async reading
                        process.BeginOutputReadLine();
                        process.BeginErrorReadLine();

                    // Wait for the process to exit (with timeout)
                    bool exited = process.WaitForExit(30000); // 30 second timeout

                    if (!exited)
                    {
                        process.Kill();
                        return Ok(new
                        {
                            success = false,
                            output = "Error: El código tardó demasiado en ejecutarse (timeout de 30 segundos)",
                            error = "Timeout"
                        });
                    }

                        // Wait a bit for async output to complete
                        await Task.Delay(200);

                        var outputText = output.ToString().TrimEnd();
                        var errorText = error.ToString().TrimEnd();

                        return Ok(new
                        {
                            success = string.IsNullOrWhiteSpace(errorText) && process.ExitCode == 0,
                            output = string.IsNullOrWhiteSpace(outputText) && string.IsNullOrWhiteSpace(errorText) 
                                ? "(Sin salida)" 
                                : (outputText + (string.IsNullOrWhiteSpace(errorText) ? "" : "\n" + errorText)),
                            exitCode = process.ExitCode
                        });
                    }
                }
                finally
                {
                    // Clean up temporary file
                    try
                    {
                        if (System.IO.File.Exists(tempFile))
                        {
                            System.IO.File.Delete(tempFile);
                        }
                    }
                    catch { }
                }
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    success = false,
                    output = $"Error al ejecutar Python: {ex.Message}",
                    error = ex.ToString()
                });
            }
        }
    }

    public class PythonExecuteRequest
    {
        public string Code { get; set; } = string.Empty;
    }
}

