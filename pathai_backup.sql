--
-- PostgreSQL database cluster dump
--

\restrict edPgzW6B6x9uGpY6GjreflT4esGpudFoUZIbE4b30tVpuCnYvl5swpxvvuOkN3X

SET default_transaction_read_only = off;

SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;

--
-- Roles
--

CREATE ROLE postgres;
ALTER ROLE postgres WITH SUPERUSER INHERIT CREATEROLE CREATEDB LOGIN REPLICATION BYPASSRLS PASSWORD 'SCRAM-SHA-256$4096:eLVGK5t7groq+LLQr03qtw==$BlQRVaBQBTx4dC2ifsOwntE3P4F6ydBpwGkNE27owTg=:b63NPKWo3uOc+/mfsD214eZaKHrYXzOVahq5W2zUOvE=';

--
-- User Configurations
--








\unrestrict edPgzW6B6x9uGpY6GjreflT4esGpudFoUZIbE4b30tVpuCnYvl5swpxvvuOkN3X

--
-- Databases
--

--
-- Database "template1" dump
--

\connect template1

--
-- PostgreSQL database dump
--

\restrict anLquzwY2c065c1RO03hO2kXVmePhdyXuCWypFaccu1Wk2eSA5DEluWqbWhyfbv

-- Dumped from database version 16.14
-- Dumped by pg_dump version 16.14

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- PostgreSQL database dump complete
--

\unrestrict anLquzwY2c065c1RO03hO2kXVmePhdyXuCWypFaccu1Wk2eSA5DEluWqbWhyfbv

--
-- Database "ai_campus_os" dump
--

--
-- PostgreSQL database dump
--

\restrict IhkxMPFJKbB9WNUAR5QhKXQOpLNNndHEadj3PKK6cqRi836ubvmR6cnzjhnGHLl

-- Dumped from database version 16.14
-- Dumped by pg_dump version 16.14

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: ai_campus_os; Type: DATABASE; Schema: -; Owner: postgres
--

CREATE DATABASE ai_campus_os WITH TEMPLATE = template0 ENCODING = 'UTF8' LOCALE_PROVIDER = libc LOCALE = 'en_US.utf8';


ALTER DATABASE ai_campus_os OWNER TO postgres;

\unrestrict IhkxMPFJKbB9WNUAR5QhKXQOpLNNndHEadj3PKK6cqRi836ubvmR6cnzjhnGHLl
\connect ai_campus_os
\restrict IhkxMPFJKbB9WNUAR5QhKXQOpLNNndHEadj3PKK6cqRi836ubvmR6cnzjhnGHLl

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- PostgreSQL database dump complete
--

\unrestrict IhkxMPFJKbB9WNUAR5QhKXQOpLNNndHEadj3PKK6cqRi836ubvmR6cnzjhnGHLl

--
-- Database "postgres" dump
--

\connect postgres

--
-- PostgreSQL database dump
--

\restrict ULgF1Evgr1iNHlexd6dV8gYprdd0q8cDzB0jZVgujxu4XRTNy4WYsxjy04u75sN

-- Dumped from database version 16.14
-- Dumped by pg_dump version 16.14

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- PostgreSQL database dump complete
--

\unrestrict ULgF1Evgr1iNHlexd6dV8gYprdd0q8cDzB0jZVgujxu4XRTNy4WYsxjy04u75sN

--
-- PostgreSQL database cluster dump complete
--

