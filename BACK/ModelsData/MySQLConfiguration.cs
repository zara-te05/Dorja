using System;
using System.Collections.Generic;
using System.Text;

namespace DorjaData
{
    public class MySQLConfiguration
    {
        public string ConnectionString { get; set; }

        public MySQLConfiguration(string connectionString) {

            connectionString = connectionString;    

        }
    }
}
