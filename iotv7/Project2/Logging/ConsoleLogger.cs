using System;

namespace Project2.Logging
{
    public sealed class ConsoleLogger : ILogger
    {
        public void Info(string message)
        {
            Console.WriteLine(DateTime.UtcNow.ToString("O") + " [INFO] " + message);
        }

        public void Warn(string message)
        {
            Console.WriteLine(DateTime.UtcNow.ToString("O") + " [WARN] " + message);
        }

        public void Error(string message, Exception exception)
        {
            Console.WriteLine(DateTime.UtcNow.ToString("O") + " [ERROR] " + message + " " + exception);
        }
    }
}
