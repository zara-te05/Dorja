using DorjaData.Repositories;
using DorjaModelado;
using DorjaModelado.Repositories;
using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace BACK.Services
{
    public class ExerciseService
    {
        private readonly IProblemaRepository _problemaRepository;
        private readonly IProgreso_ProblemaRepository _progresoProblemaRepository;
        private readonly IUserRepository _userRepository;

        public ExerciseService(
            IProblemaRepository problemaRepository,
            IProgreso_ProblemaRepository progresoProblemaRepository,
            IUserRepository userRepository)
        {
            _problemaRepository = problemaRepository;
            _progresoProblemaRepository = progresoProblemaRepository;
            _userRepository = userRepository;
        }

        /// <summary>
        /// Gets a random problem for the user based on their current level
        /// Excludes problems the user has already completed
        /// </summary>
        public async Task<Problema> GetRandomProblemForUser(int userId)
        {
            // Get user's current level
            var user = await _userRepository.GetDetails(userId);
            if (user == null)
            {
                throw new Exception("Usuario no encontrado");
            }

            int nivelActual = user.NivelActual;

            // Get all problems for the user's current level
            var problemasNivel = await _problemaRepository.GetProblemasByNivel(nivelActual);
            var problemasList = problemasNivel.ToList();

            if (problemasList.Count == 0)
            {
                throw new Exception("No hay problemas disponibles para tu nivel actual");
            }

            // Get user's completed problems
            var progresos = await _progresoProblemaRepository.GetByUserId(userId);
            var completedProblemaIds = progresos
                .Where(p => p.Completado)
                .Select(p => p.ProblemaId)
                .ToHashSet();

            // Filter out completed problems and locked problems
            var availableProblemas = problemasList
                .Where(p => !completedProblemaIds.Contains(p.Id) && !p.Locked)
                .ToList();

            // If all problems are completed, allow repeating (for practice)
            if (availableProblemas.Count == 0)
            {
                availableProblemas = problemasList
                    .Where(p => !p.Locked)
                    .ToList();
            }

            if (availableProblemas.Count == 0)
            {
                throw new Exception("No hay problemas disponibles. Todos están bloqueados.");
            }

            // Select a random problem
            var random = new Random();
            var selectedProblema = availableProblemas[random.Next(availableProblemas.Count)];

            return selectedProblema;
        }

        /// <summary>
        /// Validates a solution by executing both the user's code and the solution code,
        /// then comparing their outputs
        /// </summary>
        public async Task<ValidationResult> ValidateSolution(int userId, int problemaId, string codigo, string language = "python")
        {
            // Log for debugging
            Console.WriteLine($"Validating solution - UserId: {userId}, ProblemaId: {problemaId}, Code length: {codigo?.Length ?? 0}");
            
            var problema = await _problemaRepository.GetDetails(problemaId);
            if (problema == null)
            {
                // Get all problems to help debug
                var allProblems = await _problemaRepository.GetAllProblemas();
                var problemIds = string.Join(", ", allProblems.Take(20).Select(p => $"ID:{p.Id} Tema:{p.TemaId}"));
                Console.WriteLine($"Problema {problemaId} not found. Available problems: {problemIds}");
                return new ValidationResult 
                { 
                    IsCorrect = false, 
                    Message = $"Problema con ID {problemaId} no encontrado. Problemas disponibles: {problemIds}" 
                };
            }

            if (string.IsNullOrWhiteSpace(codigo))
            {
                return new ValidationResult { IsCorrect = false, Message = "El código no puede estar vacío" };
            }

            // Execute user's code
            var userResult = await ExecuteCode(codigo, language);
            if (!userResult.Success)
            {
                return new ValidationResult 
                { 
                    IsCorrect = false, 
                    Message = $"Error al ejecutar tu código: {userResult.Output}" 
                };
            }

            // Execute solution code
            var solutionResult = await ExecuteCode(problema.Solucion, language);
            if (!solutionResult.Success)
            {
                // If solution code has errors, fall back to string comparison
                bool isValid = ValidateByStringComparison(codigo, problema.Solucion);
                await UpdateProgress(userId, problemaId, codigo, isValid, problema.PuntosOtorgados);
                return new ValidationResult
                {
                    IsCorrect = isValid,
                    Message = isValid 
                        ? $"¡Solución correcta! Has ganado {problema.PuntosOtorgados} puntos." 
                        : "La solución no es correcta. Revisa tu código e intenta de nuevo.",
                    PuntosOtorgados = isValid ? problema.PuntosOtorgados : 0,
                    UserOutput = userResult.Output,
                    ExpectedOutput = "(No disponible - error en código de solución)"
                };
            }

            // Compare outputs (normalized)
            var userOutput = NormalizeOutput(userResult.Output);
            var solutionOutput = NormalizeOutput(solutionResult.Output);

            bool isCorrect = userOutput == solutionOutput;

            // If outputs don't match, try string comparison as fallback
            if (!isCorrect)
            {
                isCorrect = ValidateByStringComparison(codigo, problema.Solucion);
            }

            // Update progress
            await UpdateProgress(userId, problemaId, codigo, isCorrect, problema.PuntosOtorgados);

            return new ValidationResult
            {
                IsCorrect = isCorrect,
                Message = isCorrect 
                    ? $"¡Solución correcta! Has ganado {problema.PuntosOtorgados} puntos." 
                    : "La solución no es correcta. Revisa tu código e intenta de nuevo.",
                PuntosOtorgados = isCorrect ? problema.PuntosOtorgados : 0,
                UserOutput = userResult.Output,
                ExpectedOutput = solutionResult.Output
            };
        }

        /// <summary>
        /// Executes code and returns the output
        /// </summary>
        private async Task<CodeExecutionResult> ExecuteCode(string code, string language)
        {
            try
            {
                var output = new StringBuilder();
                var error = new StringBuilder();
                string command = "";
                string tempFile = "";

                // Determine command and file extension based on language
                if (language.ToLower() == "python")
                {
                    command = "python3";
                    try
                    {
                        var testProcess = new Process
                        {
                            StartInfo = new ProcessStartInfo
                            {
                                FileName = command,
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
                            command = "python";
                        }
                    }
                    catch
                    {
                        command = "python";
                    }
                    tempFile = System.IO.Path.Combine(System.IO.Path.GetTempPath(), $"code_validation_{Guid.NewGuid()}.py");
                }
                else if (language.ToLower() == "csharp" || language.ToLower() == "c#")
                {
                    command = "dotnet";
                    tempFile = System.IO.Path.Combine(System.IO.Path.GetTempPath(), $"code_validation_{Guid.NewGuid()}.csx");
                }
                else
                {
                    return new CodeExecutionResult 
                    { 
                        Success = false, 
                        Output = $"Lenguaje no soportado: {language}" 
                    };
                }

                // Write code to temporary file
                await System.IO.File.WriteAllTextAsync(tempFile, code, Encoding.UTF8);

                try
                {
                    ProcessStartInfo processStartInfo;
                    
                    if (language.ToLower() == "csharp" || language.ToLower() == "c#")
                    {
                        processStartInfo = new ProcessStartInfo
                        {
                            FileName = "dotnet",
                            Arguments = $"script \"{tempFile}\"",
                            RedirectStandardOutput = true,
                            RedirectStandardError = true,
                            UseShellExecute = false,
                            CreateNoWindow = true,
                            WorkingDirectory = System.IO.Path.GetDirectoryName(tempFile),
                            StandardOutputEncoding = Encoding.UTF8,
                            StandardErrorEncoding = Encoding.UTF8
                        };
                    }
                    else
                    {
                        processStartInfo = new ProcessStartInfo
                        {
                            FileName = command,
                            Arguments = $"\"{tempFile}\"",
                            RedirectStandardOutput = true,
                            RedirectStandardError = true,
                            UseShellExecute = false,
                            CreateNoWindow = true,
                            StandardOutputEncoding = Encoding.UTF8,
                            StandardErrorEncoding = Encoding.UTF8
                        };
                    }

                    using (var process = new Process())
                    {
                        process.StartInfo = processStartInfo;
                        
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
                        process.BeginOutputReadLine();
                        process.BeginErrorReadLine();

                        bool exited = process.WaitForExit(10000); // 10 second timeout for validation

                        if (!exited)
                        {
                            process.Kill();
                            return new CodeExecutionResult 
                            { 
                                Success = false, 
                                Output = "Timeout: El código tardó demasiado en ejecutarse" 
                            };
                        }

                        await Task.Delay(200);

                        var outputText = output.ToString().TrimEnd();
                        var errorText = error.ToString().TrimEnd();

                        if (!string.IsNullOrWhiteSpace(errorText))
                        {
                            return new CodeExecutionResult 
                            { 
                                Success = false, 
                                Output = CleanErrorMessage(errorText, tempFile) 
                            };
                        }

                        return new CodeExecutionResult 
                        { 
                            Success = true, 
                            Output = string.IsNullOrWhiteSpace(outputText) ? "(Sin salida)" : outputText 
                        };
                    }
                }
                finally
                {
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
                return new CodeExecutionResult 
                { 
                    Success = false, 
                    Output = $"Error al ejecutar el código: {ex.Message}" 
                };
            }
        }

        private string CleanErrorMessage(string error, string tempFile)
        {
            if (string.IsNullOrWhiteSpace(error))
                return error;

            var cleaned = error;
            if (!string.IsNullOrWhiteSpace(tempFile))
            {
                cleaned = cleaned.Replace(tempFile, "[archivo temporal]");
                var tempDir = System.IO.Path.GetDirectoryName(tempFile);
                if (!string.IsNullOrWhiteSpace(tempDir))
                {
                    cleaned = cleaned.Replace(tempDir, "[directorio temporal]");
                }
            }

            cleaned = System.Text.RegularExpressions.Regex.Replace(cleaned, @"[A-Z]:\\[^\\]+\\Temp\\[^\s]+", "[archivo temporal]");
            cleaned = System.Text.RegularExpressions.Regex.Replace(cleaned, @"/tmp/[^\s]+", "[archivo temporal]");
            cleaned = System.Text.RegularExpressions.Regex.Replace(cleaned, @"C:\\Users\\[^\\]+\\AppData\\Local\\Temp\\[^\s]+", "[archivo temporal]");

            return cleaned.Trim();
        }

        private string NormalizeOutput(string output)
        {
            if (string.IsNullOrEmpty(output)) return "";
            // Remove trailing whitespace and normalize line endings
            return output.TrimEnd().Replace("\r\n", "\n").Replace("\r", "\n");
        }

        private bool ValidateByStringComparison(string userCode, string solutionCode)
        {
            // Normalize both codes for comparison
            var normalizedUser = NormalizeCode(userCode);
            var normalizedSolution = NormalizeCode(solutionCode);
            
            // Check if user code contains key elements of solution
            // This is a fallback for cases where execution comparison fails
            return normalizedUser.Contains(normalizedSolution) || 
                   normalizedSolution.Contains(normalizedUser) ||
                   AreFunctionallySimilar(normalizedUser, normalizedSolution);
        }

        private string NormalizeCode(string code)
        {
            if (string.IsNullOrEmpty(code)) return "";
            // Remove comments, whitespace, and normalize
            var lines = code.Split('\n');
            var cleaned = new StringBuilder();
            foreach (var line in lines)
            {
                var trimmed = line.Trim();
                // Skip empty lines and comments
                if (!string.IsNullOrEmpty(trimmed) && !trimmed.StartsWith("#") && !trimmed.StartsWith("//"))
                {
                    cleaned.Append(trimmed.Replace(" ", "").Replace("\t", ""));
                }
            }
            return cleaned.ToString().ToLower();
        }

        private bool AreFunctionallySimilar(string code1, string code2)
        {
            // Simple similarity check - in production, use more sophisticated comparison
            if (code1.Length == 0 || code2.Length == 0) return false;
            
            // Calculate similarity ratio
            int matches = 0;
            int minLength = Math.Min(code1.Length, code2.Length);
            for (int i = 0; i < minLength; i++)
            {
                if (code1[i] == code2[i]) matches++;
            }
            
            double similarity = (double)matches / Math.Max(code1.Length, code2.Length);
            return similarity > 0.8; // 80% similarity threshold
        }

        private async Task UpdateProgress(int userId, int problemaId, string codigo, bool isCorrect, int puntosOtorgados)
        {
            try
            {
                // Validate that the user exists before attempting to insert
                var user = await _userRepository.GetDetails(userId);
                if (user == null)
                {
                    throw new InvalidOperationException($"No se puede actualizar el progreso: El usuario con ID {userId} no existe.");
                }

                // Validate that the problem exists before attempting to insert
                var problem = await _problemaRepository.GetDetails(problemaId);
                if (problem == null)
                {
                    // Log available problems for debugging
                    var allProblems = await _problemaRepository.GetAllProblemas();
                    var problemIds = string.Join(", ", allProblems.Take(10).Select(p => p.Id));
                    throw new InvalidOperationException(
                        $"No se puede actualizar el progreso: El problema con ID {problemaId} no existe en la base de datos. " +
                        $"Problemas disponibles (primeros 10): {problemIds}");
                }

            try
            {
                var progreso = await _progresoProblemaRepository.GetByUserAndProblema(userId, problemaId);
                
                if (progreso == null)
                {
                    // Create new progress record
                    progreso = new Progreso_Problema
                    {
                        UserId = userId,
                        ProblemaId = problemaId,
                        Completado = isCorrect,
                        Puntuacion = isCorrect ? puntosOtorgados : 0,
                        Intentos = 1,
                        UltimoCodigo = codigo,
                        FechaCompletado = isCorrect ? DateTime.UtcNow : (DateTime?)null
                    };
                    await _progresoProblemaRepository.InsertProgreso_Problemas(progreso);
                }
                else
                {
                    // Update existing progress
                    if (isCorrect && !progreso.Completado)
                    {
                        progreso.Completado = true;
                        progreso.Puntuacion = puntosOtorgados;
                        progreso.FechaCompletado = DateTime.UtcNow;
                        
                        // Update user's total points and level
                        await UpdateUserPoints(userId, puntosOtorgados);
                    }
                    progreso.Intentos++;
                    progreso.UltimoCodigo = codigo;
                    await _progresoProblemaRepository.UpdateProgreso_Problemas(progreso);
                }
            }
            catch (Exception ex) when (ex.Message.Contains("FOREIGN KEY constraint failed"))
            {
                throw new InvalidOperationException(
                    $"Error de base de datos: No se puede guardar el progreso. " +
                    $"Verifica que el problema con ID {problemaId} existe en la base de datos.", 
                    ex);
            }
        }

        private async Task UpdateUserPoints(int userId, int puntos)
        {
            var user = await _userRepository.GetDetails(userId);
            if (user != null)
            {
                user.PuntosTotales += puntos;
                // Level up logic could be added here
                await _userRepository.UpdateUsuarios(user);
            }
        }
    }

    public class ValidationResult
    {
        public bool IsCorrect { get; set; }
        public string Message { get; set; } = "";
        public int PuntosOtorgados { get; set; }
        public string? UserOutput { get; set; }
        public string? ExpectedOutput { get; set; }
    }

    internal class CodeExecutionResult
    {
        public bool Success { get; set; }
        public string Output { get; set; } = "";
    }
}
